import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { resolveSignupTown } from '@/lib/marketing/signup';
import { computeWaitlistStats, fetchTownQueue } from '@/lib/marketing/waitlist';
import { formPage, isFormPost } from '@/lib/marketing/form-page';
import { LAUNCH_CARD_LIMIT } from '../../../../config/towns';

// H11: bump this whenever the consent checkbox copy changes, so every row
// records exactly which wording the shopper agreed to.
const CONSENT_VERSION = 'v1';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  townSlug: z.string().trim().min(1).optional(),
  townFreeText: z.string().trim().min(1).optional(),
  postcode: z.string().trim().optional(),
  consentMarketing: z.boolean().optional().default(false),
  source: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional().default({}),
  refCode: z.string().optional(),
});

async function parseBody(req: NextRequest): Promise<unknown> {
  if (!isFormPost(req)) return req.json().catch(() => ({}));
  const form = await req.formData();
  return {
    email: form.get('email'),
    password: form.get('password') || undefined,
    townSlug: form.get('townSlug') || undefined,
    townFreeText: form.get('townFreeText') || undefined,
    postcode: form.get('postcode') || undefined,
    consentMarketing: form.get('consentMarketing') === 'on',
    source: form.get('source') || undefined,
    refCode: form.get('refCode') || undefined,
  };
}

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Writes the waitlist row every signup gets (live-town signups included —
 * it's also how a live town's queue is seeded for when it hits capacity).
 * "Duplicate email+town is a no-op success" (AC): on a conflict, this
 * looks up and returns the row that already exists instead of erroring, so
 * a returning visitor still gets back their own referral code. Returns
 * null only on a genuine write failure.
 */
async function upsertSignup(
  supabase: SupabaseServiceClient,
  data: z.infer<typeof bodySchema>,
  validatedRefCode: string | null,
): Promise<{ referralCode: string } | null> {
  const townColumn = data.townSlug ? 'town_slug' : 'town_free_text';
  const townValue = data.townSlug ?? data.townFreeText ?? '';

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: inserted, error } = await supabase
      .from('signups')
      .insert({
        email: data.email,
        town_slug: data.townSlug ?? null,
        town_free_text: data.townFreeText ?? null,
        postcode: data.postcode || null,
        consent_marketing: data.consentMarketing,
        consent_version: CONSENT_VERSION,
        source: data.source ?? null,
        utm: data.utm,
        ref_code: validatedRefCode,
      })
      .select('referral_code')
      .single();
    if (!error) return { referralCode: inserted.referral_code };
    if (error.code !== '23505') return null;

    // Conflict is almost always the expected email+town duplicate; on the
    // astronomically unlikely chance it's a referral_code collision
    // instead, this lookup finds nothing and the loop retries once so the
    // DB default regenerates a fresh code.
    const { data: existing } = await supabase
      .from('signups')
      .select('referral_code')
      .eq('email', data.email)
      .eq(townColumn, townValue)
      .maybeSingle();
    if (existing) return { referralCode: existing.referral_code };
  }
  return null;
}

async function waitlistStats(supabase: SupabaseServiceClient, townSlug: string | null, townFreeText: string | null, code: string) {
  const rows = await fetchTownQueue(supabase, townSlug, townFreeText);
  return computeWaitlistStats(rows, code);
}

// One form, one step: for a live town under its launch cap, this creates
// the account AND the pass AND signs the shopper in — no separate claim
// step, no wallet-file dependency (that's a later, optional action from
// the wallet page). For anywhere else — not live yet, or a live town whose
// first LAUNCH_CARD_LIMIT passes are already claimed — it's the same
// waitlist signup, with a referral code to move up it.
export async function POST(req: NextRequest) {
  const isForm = isFormPost(req);
  const parsed = bodySchema.safeParse(await parseBody(req));
  if (!parsed.success) {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please check your details and try again.</p>', 400)
      : NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const data = parsed.data;
  if (!data.townSlug && !data.townFreeText) {
    return isForm
      ? formPage('Town required', '<h1>Please pick a town</h1>', 400)
      : NextResponse.json({ error: 'town_required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  let validatedRefCode: string | null = null;
  if (data.refCode) {
    const { data: referrer } = await supabase.from('signups').select('id').eq('referral_code', data.refCode).maybeSingle();
    if (referrer) validatedRefCode = data.refCode;
  }

  const signup = await upsertSignup(supabase, data, validatedRefCode);
  if (!signup) {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
      : NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }

  const resolution = resolveSignupTown(data.townSlug ?? null, data.townFreeText ?? null);

  // A live town whose launch batch is already claimed falls back onto the
  // exact same waitlist path as a not-yet-live one.
  let atCapacity = false;
  let liveTown: { id: string; name: string } | null = null;
  if (resolution.kind === 'live') {
    const { data: town } = await supabase.from('towns').select('id, name').eq('slug', data.townSlug!).maybeSingle();
    if (town) {
      liveTown = town;
      const { count } = await supabase
        .from('passes')
        .select('id', { count: 'exact', head: true })
        .eq('town_id', town.id)
        .is('revoked_at', null);
      atCapacity = (count ?? 0) >= LAUNCH_CARD_LIMIT;
    }
    // No `towns` row yet: config says live, ops hasn't onboarded it — the
    // account-creation branch below re-checks this and returns
    // `town_not_ready`, so nothing more to do here.
  }

  if (resolution.kind !== 'live' || atCapacity) {
    const stats = await waitlistStats(supabase, data.townSlug ?? null, data.townFreeText ?? null, signup.referralCode);
    const kind = atCapacity ? 'capacity' : resolution.kind;
    const townName = atCapacity && liveTown ? liveTown.name : resolution.label;

    if (isForm) {
      const body =
        kind === 'coming-soon'
          ? `<h1>You're in.</h1><p>We'll tell you the day ${townName} goes live.</p>`
          : kind === 'capacity'
            ? `<h1>You're in.</h1><p>${townName}'s first ${LAUNCH_CARD_LIMIT} passes are already claimed — you're on the early-access list. Refer friends to move up.</p>`
            : `<h1>Thanks — you just voted for ${townName}.</h1><p>${stats?.totalInQueue ?? 1} ${stats?.totalInQueue === 1 ? 'person' : 'people'} in ${townName} want Regulars.</p>`;
      return formPage('Signed up — Regulars', body);
    }
    return NextResponse.json({
      status: kind,
      townName,
      count: stats?.totalInQueue,
      referralCode: signup.referralCode,
      position: stats?.position,
      totalInQueue: stats?.totalInQueue,
    });
  }

  // Live town, under capacity: this is a real account, not a waitlist entry.
  if (!data.password) {
    return isForm
      ? formPage('Password required', '<h1>Please set a password</h1>', 400)
      : NextResponse.json({ error: 'password_required' }, { status: 400 });
  }
  const townSlug = data.townSlug!;

  const town = liveTown;
  if (!town) {
    // config/towns.ts says this town is live, but ops hasn't onboarded it
    // in the database yet — there's nothing to create a pass against.
    return isForm
      ? formPage('Not quite ready', '<h1>This town isn’t open for sign-ups yet</h1>', 503)
      : NextResponse.json({ error: 'town_not_ready' }, { status: 503 });
  }

  const routeClient = await createRouteHandlerSupabaseClient();
  let userId: string;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    const alreadyExists = createErr?.message.toLowerCase().includes('already') ?? false;
    if (!alreadyExists) {
      return isForm
        ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
        : NextResponse.json({ error: 'signup_failed', message: createErr?.message }, { status: 500 });
    }
    // Existing account — treat this as a sign-in with the password they just gave.
    const { data: signedIn, error: signInErr } = await routeClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInErr || !signedIn.user) {
      return isForm
        ? formPage(
            'Already signed up',
            '<h1>You already have an account</h1><p>That password doesn’t match — sign in or reset your password instead.</p>',
            409,
          )
        : NextResponse.json({ error: 'incorrect_password' }, { status: 409 });
    }
    userId = signedIn.user.id;
  } else {
    userId = created.user.id;
    const { error: signInErr } = await routeClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInErr) {
      return isForm
        ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
        : NextResponse.json({ error: 'sign_in_failed' }, { status: 500 });
    }
  }

  const { data: existingPass } = await supabase
    .from('passes')
    .select('id')
    .eq('user_id', userId)
    .eq('town_id', town.id)
    .is('revoked_at', null)
    .maybeSingle();

  if (!existingPass) {
    const { error: passError } = await supabase.from('passes').insert({
      user_id: userId,
      town_id: town.id,
      serial: randomUUID(),
      secret: randomBytes(32).toString('hex'),
      balance_points: 0,
    });
    if (passError) {
      return isForm
        ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
        : NextResponse.json({ error: 'pass_create_failed' }, { status: 500 });
    }
  }

  const redirectTo = `/${townSlug}/app/wallet`;
  if (isForm) {
    return NextResponse.redirect(new URL(redirectTo, req.nextUrl.origin), { status: 303 });
  }
  return NextResponse.json({ status: 'live', townName: town.name, redirectTo });
}
