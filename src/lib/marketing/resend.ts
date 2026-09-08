/**
 * Shared Resend sender — every outbound marketing/notification email in
 * this app goes through here. Best-effort by design (callers never await
 * this into a user-facing failure): a missing/misconfigured API key logs a
 * warning and no-ops rather than throwing, same as the original
 * notify-lead.ts behaviour this was extracted from.
 */
export interface ResendEmailInput {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendResendEmail(input: ResendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[resend] RESEND_API_KEY not configured — skipping "${input.subject}" to ${input.to}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      console.error('[resend] request failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('[resend] request threw', err);
  }
}
