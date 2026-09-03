import { createHmac, timingSafeEqual } from 'node:crypto';

// R2: pass QR encodes pass_id + a time-based token, refreshed on a 60s step.
// A token is accepted up to 1 step in the future (clock skew) and up to
// MAX_AGE_SECONDS (5 minutes) in the past — beyond that a static screenshot
// of the QR is rejected per the AC in the PRD.
export const STEP_SECONDS = 60;
export const FUTURE_TOLERANCE_STEPS = 1;
export const MAX_AGE_SECONDS = 5 * 60;

function stepFor(unixSeconds: number): number {
  return Math.floor(unixSeconds / STEP_SECONDS);
}

function hmacToken(secret: string, passId: string, step: number): string {
  return createHmac('sha256', secret).update(`${passId}:${step}`).digest('hex').slice(0, 8);
}

export interface RotatingToken {
  passId: string;
  step: number;
  token: string;
}

/** Generate the token that should currently be showing on a pass's QR code. */
export function generateToken(
  secret: string,
  passId: string,
  now: Date = new Date(),
): RotatingToken {
  const step = stepFor(Math.floor(now.getTime() / 1000));
  return { passId, step, token: hmacToken(secret, passId, step) };
}

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: 'mismatch' | 'expired' };

/**
 * Verify a scanned {passId, step, token} against the secret for that pass.
 * `step` is included in the QR payload so verification doesn't need to
 * brute-force every recent window — but we still bound accepted step drift
 * so a stale/tampered step field can't extend a token's life.
 */
export function verifyToken(
  secret: string,
  passId: string,
  step: number,
  token: string,
  now: Date = new Date(),
): VerifyResult {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  // Age measured from the start of the token's step, so a token is never
  // considered younger than it could actually be.
  const ageSeconds = nowSeconds - step * STEP_SECONDS;

  if (ageSeconds < -FUTURE_TOLERANCE_STEPS * STEP_SECONDS || ageSeconds > MAX_AGE_SECONDS) {
    return { valid: false, reason: 'expired' };
  }

  const expected = Buffer.from(hmacToken(secret, passId, step), 'hex');
  const actual = Buffer.from(token, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { valid: false, reason: 'mismatch' };
  }

  return { valid: true };
}

/** Serialize the QR payload embedded in the wallet pass barcode message. */
export function encodeQrPayload(t: RotatingToken): string {
  return `${t.passId}.${t.step}.${t.token}`;
}

export function decodeQrPayload(
  payload: string,
): { passId: string; step: number; token: string } | null {
  const parts = payload.split('.');
  if (parts.length !== 3) return null;
  const [passId, stepStr, token] = parts;
  const step = Number(stepStr);
  if (!passId || !token || !Number.isFinite(step)) return null;
  return { passId, step, token };
}
