import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveSignupTown } from '@/lib/marketing/signup';
import { formPage, isFormPost } from '@/lib/marketing/form-page';

// H11: bump this whenever the consent checkbox copy changes, so every row
// records exactly which wording the shopper agreed to.
const CONSENT_VERSION = 'v1';

const bodySchema = z.object({
  email: z.string().email(),
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
    townSlug: form.get('townSlug') || undefined,
    townFreeText: form.get('townFreeText') || undefined,
    postcode: form.get('postcode') || undefined,
    consentMarketing: form.get('consentMarketing') === 'on',
    source: form.get('source') || undefined,
    refCode: form.get('refCode') || undefined,
  };
}

// AC: "Given JavaScript is disabled, when the shopper form is submitted,
// then it still posts and shows a server-rendered success page." A plain
// <form method="POST" action="/api/signup"> hits this exact route with no
// JS involved; the fetch-based client path (ShopperForm.tsx) posts JSON to
// the same route and renders its own richer inline state instead.
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
  const { error } = await supabase.from('signups').insert({
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
  if (error && error.code !== '23505') {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
      : NextResponse.json({ error: 'signup_failed' }, { status: 500 });
  }

  const resolution = resolveSignupTown(data.townSlug ?? null, data.townFreeText ?? null);

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
      resolution.kind === 'live'
        ? `<h1>You're in!</h1><p>Check your email for your Local pass link — we'll send it over shortly.</p>`
        : resolution.kind === 'coming-soon'
          ? `<h1>You're in.</h1><p>We'll tell you the day ${resolution.label} goes live.</p>`
          : `<h1>Thanks — you just voted for ${resolution.label}.</h1><p>${count} ${count === 1 ? 'person' : 'people'} in ${resolution.label} want Local.</p>`;
    return formPage('Signed up — Local', body);
  }

  return NextResponse.json({ status: resolution.kind, townName: resolution.label, count });
}
