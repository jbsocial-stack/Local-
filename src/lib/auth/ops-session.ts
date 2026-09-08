import { createHmac, timingSafeEqual } from 'node:crypto';

// Single shared password for the internal ops console — same
// signed-cookie shape as staff-session.ts (merchant PIN login), chosen
// over Supabase's magic-link email because that round-trip depends on a
// working email provider and a reachable callback URL; a password check
// has neither dependency.
const COOKIE_NAME = 'regulars_ops_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // a week — admin convenience, not a shift

function secret(): string {
  const s = process.env.PASS_TOKEN_SECRET;
  if (!s) throw new Error('Missing PASS_TOKEN_SECRET env var');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createOpsSessionToken(now = new Date()): string {
  const body = JSON.stringify({ iat: Math.floor(now.getTime() / 1000) });
  const encoded = Buffer.from(body, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyOpsSessionToken(token: string, now = new Date()): boolean {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;

  const expected = sign(encoded);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const body = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { iat: number };
    const ageSeconds = Math.floor(now.getTime() / 1000) - body.iat;
    return ageSeconds >= 0 && ageSeconds <= SESSION_TTL_SECONDS;
  } catch {
    return false;
  }
}

export { COOKIE_NAME as OPS_SESSION_COOKIE, SESSION_TTL_SECONDS };
