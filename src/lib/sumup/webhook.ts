import { createHmac, timingSafeEqual } from 'node:crypto';

// Confirmed against developer.sumup.com (Sept 2026): SumUp signs each
// webhook delivery with HMAC-SHA256 over the raw request body, carried in
// an `x-payload-signature` header, using a secret configured for your
// webhook endpoint. SumUp also documents that the payload itself is thin
// ({ event_type, id }) and that your endpoint should always re-fetch the
// actual resource by id to confirm what happened rather than trust the
// payload alone — deliberately not parsed further here for that reason;
// see sumup/webhook events route for the confirm-by-refetch step.
export const SUMUP_SIGNATURE_HEADER = 'x-payload-signature';

/** `rawBody` must be the exact bytes SumUp sent — verifying a
    re-serialized/parsed-then-stringified body can disagree with the
    original signature over whitespace or key ordering. */
export function verifySumUpSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signatureHeader, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export interface SumUpWebhookEvent {
  eventType: string;
  checkoutId: string;
}

/** Parses only the two fields SumUp's own docs guarantee are present —
    everything else about a checkout's actual status should come from
    re-fetching it, not from trusting more of this payload. */
export function parseSumUpWebhookBody(rawBody: string): SumUpWebhookEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (typeof json !== 'object' || json === null) return null;
  const { event_type, id } = json as Record<string, unknown>;
  if (typeof event_type !== 'string' || typeof id !== 'string') return null;
  return { eventType: event_type, checkoutId: id };
}
