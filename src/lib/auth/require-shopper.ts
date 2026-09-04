import { createRouteHandlerSupabaseClient } from '../supabase/route-handler';
import { createServiceClient } from '../supabase/server';
import type { PassPlatform } from '../supabase/types';

export interface ShopperPass {
  id: string;
  balancePoints: number;
  platform: PassPlatform | null;
}

export type RequireShopperResult =
  | { ok: true; userId: string; pass: ShopperPass }
  | { ok: false; reason: 'not_signed_in' | 'no_pass' };

/**
 * Gates the signed-in shopper app (wallet/discover/offers/profile) — a real
 * Supabase Auth session (magic link, same as owner/ops) plus an unrevoked
 * pass for this specific town. Distinct from requireOwner/requireOps: any
 * signed-in user qualifies, there's no membership table to check against.
 */
export async function requireShopper(townSlug: string): Promise<RequireShopperResult> {
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'not_signed_in' };

  const service = createServiceClient();
  const { data: town } = await service.from('towns').select('id').eq('slug', townSlug).maybeSingle();
  if (!town) return { ok: false, reason: 'no_pass' };

  const { data: pass } = await service
    .from('passes')
    .select('id, balance_points, platform')
    .eq('user_id', user.id)
    .eq('town_id', town.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pass) return { ok: false, reason: 'no_pass' };

  return {
    ok: true,
    userId: user.id,
    pass: { id: pass.id, balancePoints: pass.balance_points, platform: pass.platform },
  };
}
