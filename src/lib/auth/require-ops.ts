import { cookies } from 'next/headers';
import { OPS_SESSION_COOKIE, verifyOpsSessionToken } from './ops-session';

export type RequireOpsResult = { ok: true } | { ok: false; reason: string };

/** Gates the ops console — a shared password behind a signed cookie, same shape as the merchant staff PIN session. */
export async function requireOps(): Promise<RequireOpsResult> {
  const jar = await cookies();
  const token = jar.get(OPS_SESSION_COOKIE)?.value;
  if (!token || !verifyOpsSessionToken(token)) {
    return { ok: false, reason: 'not_signed_in' };
  }
  return { ok: true };
}
