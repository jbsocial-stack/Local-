import { renderEmailTemplate } from './render-email';
import { sendResendEmail } from './resend';

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Fired from the waitlist branch of /api/signup — every non-live signup,
 * including a live town that's already hit its launch cap. Best-effort,
 * same as notifyLead: a missing RESEND_API_KEY or a failed send must never
 * fail the signup itself.
 */
export async function sendShopperWelcomeEmail(input: {
  email: string;
  townName: string;
  townPath: string; // e.g. '/chichester/shoppers' or '/shoppers' for a free-text town
  referralCode: string;
}): Promise<void> {
  const from = process.env.MARKETING_EMAIL_FROM;
  if (!from) {
    console.warn('[welcome-emails] MARKETING_EMAIL_FROM not configured — skipping shopper welcome email');
    return;
  }
  const html = await renderEmailTemplate('welcome-regular.html', {
    town_name: input.townName,
    referral_link: `${appOrigin()}${input.townPath}?ref=${input.referralCode}`,
  });
  await sendResendEmail({
    to: input.email,
    from,
    subject: 'Welcome, new Regular — you’re on the list',
    html,
  });
}

/**
 * Fired from /api/lead right after a merchant_leads row is written —
 * separate from notifyLead, which tells ops about the lead; this tells the
 * business itself. Same best-effort contract.
 */
export async function sendBusinessWelcomeEmail(input: {
  email: string;
  businessName: string;
  contactName: string;
  townName: string;
}): Promise<void> {
  const from = process.env.MARKETING_EMAIL_FROM;
  if (!from) {
    console.warn('[welcome-emails] MARKETING_EMAIL_FROM not configured — skipping business welcome email');
    return;
  }
  const html = await renderEmailTemplate('welcome-regular-business.html', {
    business_name: input.businessName,
    contact_name: input.contactName,
    town_name: input.townName,
    business_link: `${appOrigin()}/business`,
  });
  await sendResendEmail({
    to: input.email,
    from,
    subject: `Welcome, founding Regulars business — ${input.businessName}`,
    html,
  });
}
