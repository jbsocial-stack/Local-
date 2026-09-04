import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { resolveSignupTown } from '@/lib/marketing/signup';
import { formPage, isFormPost } from '@/lib/marketing/form-page';

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

// One form, one step: for a live town this creates the account AND the
// pass AND signs the shopper in — no separate claim step, no wallet-file
// dependency (that's a later, optional action from the wallet page). For
// anywhere else, it's still just the waitlist signup it always was — there's
// no pass to sign into yet.
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
  const { error: signupError } = await supabase.from('signups').insert({
    email: data.email,
    town_slug: data.townSlug ?? null,
    town_free_text: data.townFreeText ?? null,
    postcode: data.postcode || null,
    consent_marketing: data.consentMarketing,
    consent_version: CONSENT_VERSION,
    source: data.source ?? null,
    utm: data.utm,
    ref_code: data.refCode ?? null,
  });
  // AC: "duplicate email+town is a no-op success, ... no second row is written."
  if (signupError && signupError.code !== '23505') {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
      : NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }

  const resolution = resolveSignupTown(data.townSlug ?? null, data.townFreeText ?? null);

  if (resolution.kind !== 'live') {
    let count: number | undefined;
    if (resolution.kind === 'planned') {
      const identifier = data.townSlug ?? data.townFreeText ?? '';
      const [bySlug, byFreeText] = await Promise.all([
        supabase.from('signups').select('id', { count: 'exact', head: true }).eq('town_slug', identifier),
        supabase.from('signups').select('id', { count: 'exact', head: true }).eq('town_free_text', identifier),
      ]);
      count = (bySlug.count ?? 0) + (byFreeText.count ?? 0);
    }

    if (isForm) {
      const body =
        resolution.kind === 'coming-soon'
          ? `<h1>You're in.</h1><p>We'll tell you the day ${resolution.label} goes live.</p>`
          : `<h1>Thanks — you just voted for ${resolution.label}.</h1><p>${count} ${count === 1 ? 'person' : 'people'} in ${resolution.label} want Local.</p>`;
      return formPage('Signed up — Local', body);
    }
    return NextResponse.json({ status: resolution.kind, townName: resolution.label, count });
  }

  // Live town: this is a real account, not a waitlist entry.
  if (!data.password) {
    return isForm
      ? formPage('Password required', '<h1>Please set a password</h1>', 400)
      : NextResponse.json({ error: 'password_required' }, { status: 400 });
  }
  const townSlug = data.townSlug!;

  const { data: town } = await supabase.from('towns').select('id, name').eq('slug', townSlug).maybeSingle();
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
