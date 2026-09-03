import { timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '../supabase/server';

/**
 * Apple's PassKit Web Service authenticates every device call with an
 * `Authorization: ApplePass <token>` header, where `<token>` is the
 * pass.json `authenticationToken` baked in at generation time — which we
 * set to `passes.secret` (see lib/wallet/apple.ts).
 */
export async function authenticateAppleRequest(
  req: Request,
  serialNumber: string,
): Promise<{ passId: string } | null> {
  const header = req.headers.get('authorization') ?? '';
  const match = /^ApplePass (.+)$/.exec(header);
  const token = match?.[1];
  if (!token) return null;

  const supabase = createServiceClient();
  const { data: pass } = await supabase
    .from('passes')
    .select('id, secret, revoked_at')
    .eq('serial', serialNumber)
    .maybeSingle();
  // R9 AC: a revoked pass (re-issued to a new device) must stop
  // authenticating web-service calls, the same as it stops scanning.
  if (!pass || pass.revoked_at) return null;

  const expected = Buffer.from(pass.secret, 'utf8');
  const actual = Buffer.from(token, 'utf8');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return { passId: pass.id };
}
