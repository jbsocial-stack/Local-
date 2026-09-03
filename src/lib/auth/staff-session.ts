import { createHmac, timingSafeEqual } from 'node:crypto';

// R7: staff sign in with PIN only; the resulting session is scoped to the
// scanner and must not be able to open /m/dashboard or settings.
export interface StaffSessionPayload {
  merchantUserId: string;
  merchantId: string;
  role: 'owner' | 'staff';
  scope: 'scanner' | 'full';
}

const COOKIE_NAME = 'local_staff_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // one shift

function secret(): string {
  const s = process.env.PASS_TOKEN_SECRET;
  if (!s) throw new Error('Missing PASS_TOKEN_SECRET env var');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createStaffSessionToken(payload: StaffSessionPayload, now = new Date()): string {
  const body = JSON.stringify({ ...payload, iat: Math.floor(now.getTime() / 1000) });
  const encoded = Buffer.from(body, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyStaffSessionToken(
  token: string,
  now = new Date(),
): StaffSessionPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const body = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as
      StaffSessionPayload & { iat: number };
    const ageSeconds = Math.floor(now.getTime() / 1000) - body.iat;
    if (ageSeconds < 0 || ageSeconds > SESSION_TTL_SECONDS) return null;
    const { iat: _iat, ...payload } = body;
    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME as STAFF_SESSION_COOKIE, SESSION_TTL_SECONDS };
