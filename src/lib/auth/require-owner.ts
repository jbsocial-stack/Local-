import { createRouteHandlerSupabaseClient } from '../supabase/route-handler';
import { createServiceClient } from '../supabase/server';

export type RequireOwnerResult =
  | { ok: true; userId: string; merchantUserId: string }
  | { ok: false; reason: 'not_signed_in' | 'not_an_owner' };

/**
 * R6/R10: gates the owner's web settings/dashboard pages. Distinct from the
 * PIN till-device session (lib/auth/staff-session.ts) — this checks a real
 * Supabase Auth session against merchant_users.email, not a PIN.
 */
export async function requireOwner(merchantId: string): Promise<RequireOwnerResult> {
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, reason: 'not_signed_in' };
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from('merchant_users')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('role', 'owner')
    .ilike('email', user.email)
    .maybeSingle();

  if (!membership) {
    return { ok: false, reason: 'not_an_owner' };
  }

  return { ok: true, userId: user.id, merchantUserId: membership.id };
}
