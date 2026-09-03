import { createServiceClient } from '../supabase/server';

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: 'pass_not_found' | 'already_claimed_by_someone_else' };

/**
 * R9: attach an anonymous pass to the now-authenticated user. The pass was
 * created under a throwaway `users` row at issuance time (R1) with no auth
 * identity; claiming re-points it at the real, auth-linked user row instead
 * of trying to merge the two rows.
 */
export async function claimPassForUser(passId: string, authedUserId: string): Promise<ClaimResult> {
  const supabase = createServiceClient();

  const { data: pass } = await supabase
    .from('passes')
    .select('id, user_id, revoked_at')
    .eq('id', passId)
    .maybeSingle();
  if (!pass || pass.revoked_at) {
    return { ok: false, reason: 'pass_not_found' };
  }

  if (pass.user_id !== authedUserId) {
    const { data: currentOwner } = await supabase
      .from('users')
      .select('claimed_at')
      .eq('id', pass.user_id)
      .maybeSingle();
    if (currentOwner?.claimed_at) {
      return { ok: false, reason: 'already_claimed_by_someone_else' };
    }
  }

  await supabase.from('passes').update({ user_id: authedUserId }).eq('id', passId);
  await supabase
    .from('users')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', authedUserId)
    .is('claimed_at', null);

  return { ok: true };
}
