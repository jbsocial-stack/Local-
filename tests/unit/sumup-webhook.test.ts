import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseSumUpWebhookBody, verifySumUpSignature } from '../../src/lib/sumup/webhook';

const SECRET = 'test-webhook-secret';

function sign(body: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifySumUpSignature', () => {
  it('accepts a correctly signed payload', () => {
    const body = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-1' });
    expect(verifySumUpSignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a payload signed with the wrong secret', () => {
    const body = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-1' });
    expect(verifySumUpSignature(body, sign(body, 'wrong-secret'), SECRET)).toBe(false);
  });

  it('rejects a tampered body against the original signature', () => {
    const original = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-1' });
    const tampered = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-2' });
    expect(verifySumUpSignature(tampered, sign(original), SECRET)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    const body = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-1' });
    expect(verifySumUpSignature(body, null, SECRET)).toBe(false);
  });
});

describe('parseSumUpWebhookBody', () => {
  it('extracts event_type and id from a valid body', () => {
    const body = JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED', id: 'checkout-1' });
    expect(parseSumUpWebhookBody(body)).toEqual({ eventType: 'CHECKOUT_STATUS_CHANGED', checkoutId: 'checkout-1' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseSumUpWebhookBody('not json')).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    expect(parseSumUpWebhookBody(JSON.stringify({ event_type: 'CHECKOUT_STATUS_CHANGED' }))).toBeNull();
    expect(parseSumUpWebhookBody(JSON.stringify({ id: 'checkout-1' }))).toBeNull();
  });
});
