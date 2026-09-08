import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { findTown } from '../../../../config/towns';
import { mapVenuesToTier } from '@/lib/marketing/lead';
import { notifyLead } from '@/lib/marketing/notify-lead';
import { formPage, isFormPost } from '@/lib/marketing/form-page';

const bodySchema = z.object({
  businessName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  townSlug: z.string().trim().min(1),
  venues: z.enum(['1', '2', '3-4', '5+']),
  category: z.enum(['cafe', 'restaurant', 'bar', 'retail', 'services', 'other']),
  notes: z.string().trim().optional(),
  source: z.string().optional(),
});

async function parseBody(req: NextRequest): Promise<unknown> {
  if (!isFormPost(req)) return req.json().catch(() => ({}));
  const form = await req.formData();
  return {
    businessName: form.get('businessName'),
    contactName: form.get('contactName'),
    email: form.get('email'),
    phone: form.get('phone') || undefined,
    townSlug: form.get('townSlug'),
    venues: form.get('venues'),
    category: form.get('category'),
    notes: form.get('notes') || undefined,
    source: form.get('source') || undefined,
  };
}

// H3: writes to merchant_leads and triggers a notification email — R6's
// "ops creates merchant" flow (product app) is the next step once a lead
// converts, done manually by ops today, not wired to this table yet.
export async function POST(req: NextRequest) {
  const isForm = isFormPost(req);
  const parsed = bodySchema.safeParse(await parseBody(req));
  if (!parsed.success) {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please check your details and try again.</p>', 400)
      : NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const data = parsed.data;
  const tier = mapVenuesToTier(data.venues);
  const townLabel = findTown(data.townSlug)?.name ?? data.townSlug;

  const supabase = createServiceClient();
  const { error } = await supabase.from('merchant_leads').insert({
    business_name: data.businessName,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone || null,
    town_slug: data.townSlug,
    venues: tier,
    category: data.category,
    notes: data.notes || null,
    source: data.source ?? null,
    utm: {},
  });
  if (error) {
    return isForm
      ? formPage('Something went wrong', '<h1>Something went wrong</h1><p>Please try again.</p>', 500)
      : NextResponse.json({ error: 'lead_failed' }, { status: 500 });
  }

  // Best-effort — a notification failure must never fail the lead write.
  void notifyLead({
    businessName: data.businessName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone || null,
    townLabel,
    tier,
    category: data.category,
    notes: data.notes || null,
  });

  if (isForm) {
    return formPage(
      'Launching October 2027 — Regulars',
      "<h1>Congratulations — you're a founding Regulars business.</h1><p>Launching October 2027. We'll be in touch within 2 working days to get you set up ahead of launch.</p>",
    );
  }
  return NextResponse.json({ ok: true });
}
