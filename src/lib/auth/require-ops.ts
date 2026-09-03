import { createRouteHandlerSupabaseClient } from '../supabase/route-handler';
import { createServiceClient } from '../supabase/server';

export type RequireOpsResult = { ok: true; userId: string } | { ok: false; reason: string };

/** R11: gates the ops console. */
export async function requireOps(): Promise<RequireOpsResult> {
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, reason: 'not_signed_in' };
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from('ops_users')
    .select('id')
    .ilike('email', user.email)
    .maybeSingle();

  if (!membership) {
    return { ok: false, reason: 'not_ops' };
  }

  return { ok: true, userId: user.id };
}
