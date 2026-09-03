import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * "Delete account." A user with real ledger history can't be hard-deleted
 * — `ledger.pass_id references passes(id) on delete restrict` blocks it
 * outright, deliberately, to keep the financial record intact. Instead:
 * revoke every pass (stops it scanning or authenticating with Apple's web
 * service, same as a lost-device re-issue), scrub personally identifying
 * fields from `users`, and delete the underlying Supabase Auth identity so
 * they can no longer sign in as this account. The ledger rows themselves —
 * points earned/redeemed at real merchants — are financial history, not
 * personal data on their own, and are left untouched.
 */
export async function POST() {
  const authClient = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  }

  const supabase = createServiceClient();

  await supabase.from('passes').update({ revoked_at: new Date().toISOString() }).eq('user_id', user.id);

  await supabase
    .from('users')
    .update({ email: null, display_name: null, phone: null, avatar_url: null })
    .eq('id', user.id);

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 });
  }

  // The auth user is already gone server-side; the client calls
  // supabase.auth.signOut() itself right after this to clear its own
  // session cookies (it knows the real cookie name, we don't need to guess).
  return NextResponse.json({ ok: true });
}
