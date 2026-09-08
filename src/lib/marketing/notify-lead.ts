import { leadEmailSubject } from './lead';
import { sendResendEmail } from './resend';
import type { MerchantTier } from '../supabase/types';

export interface LeadNotificationInput {
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  townLabel: string;
  tier: MerchantTier;
  category: string;
  notes: string | null;
}

/**
 * H3: "triggers notification email" (+ optional webhook). Best-effort, same
 * pattern as pushPassUpdate in the product app — a lead is recorded in
 * merchant_leads regardless of whether anyone gets told about it, so a
 * missing/misconfigured notifier must never fail the form submission.
 */
export async function notifyLead(input: LeadNotificationInput): Promise<void> {
  const subject = leadEmailSubject(input.businessName, input.tier);
  const text = [
    `${input.businessName} (${input.category}, ${input.tier} tier) in ${input.townLabel}`,
    `Contact: ${input.contactName} <${input.email}>${input.phone ? ` · ${input.phone}` : ''}`,
    input.notes ? `Notes: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await Promise.allSettled([sendOpsEmail(subject, text), postWebhook(subject, text)]);
}

async function sendOpsEmail(subject: string, text: string): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const from = process.env.LEAD_NOTIFICATION_FROM;
  if (!to || !from) {
    console.warn('[notify-lead] LEAD_NOTIFICATION_EMAIL / LEAD_NOTIFICATION_FROM not configured — skipping email');
    return;
  }
  await sendResendEmail({ to, from, subject, text });
}

async function postWebhook(subject: string, text: string): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return; // optional per spec — silent no-op, not a warning
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${subject}\n${text}` }),
    });
    if (!res.ok) {
      console.error('[notify-lead] webhook request failed', res.status);
    }
  } catch (err) {
    console.error('[notify-lead] webhook request threw', err);
  }
}
