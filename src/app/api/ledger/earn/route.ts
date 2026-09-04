import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireStaffSession } from '@/lib/auth/require-staff';
import { calculateEarn } from '@/lib/ledger/points';
import { resolveActiveMultiplier } from '@/lib/ledger/multiplier';
import { isLikelyDuplicateEarn, DUPLICATE_WINDOW_SECONDS } from '@/lib/ledger/duplicate-guard';
import { pushPassUpdate } from '@/lib/wallet/push';

// R3: the client sends a pass id and a basket amount in pence only — points
// are always computed here, server-side. `confirmDuplicate` lets the
// merchant explicitly override the 2-minute duplicate-award guard.
const bodySchema = z.object({
  passId: z.string().uuid(),
  basketPence: z.number().int().positive(),
  confirmDuplicate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaffSession();
  if ('error' in auth) return auth.error;
  const { merchantId, merchantUserId } = auth.session;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { passId, basketPence, confirmDuplicate } = parsed.data;

  const supabase = createServiceClient();

  const { data: pass } = await supabase
    .from('passes')
    .select('id, town_id, platform, serial, revoked_at')
    .eq('id', passId)
    .maybeSingle();
  if (!pass || pass.revoked_at) {
    return NextResponse.json({ error: 'pass_not_found' }, { status: 404 });
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, town_id, status, base_multiplier')
    .eq('id', merchantId)
    .maybeSingle();
  if (!merchant || merchant.status !== 'live') {
    return NextResponse.json({ error: 'merchant_not_live' }, { status: 403 });
  }
  if (merchant.town_id !== pass.town_id) {
    return NextResponse.json({ error: 'wrong_town' }, { status: 400 });
  }

  const { data: town } = await supabase
    .from('towns')
    .select('base_points, point_value_pence')
    .eq('id', pass.town_id)
    .single();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  const { data: boosts } = await supabase
    .from('merchant_boosts')
    .select('multiplier, starts_at, ends_at')
    .eq('merchant_id', merchant.id);

  const multiplier = resolveActiveMultiplier(merchant.base_multiplier, boosts ?? []);

  if (!confirmDuplicate) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString();
    const { data: recent } = await supabase
      .from('ledger')
      .select('merchant_id, created_at')
      .eq('pass_id', passId)
      .eq('type', 'earn')
      .gte('created_at', since);

    if (isLikelyDuplicateEarn(recent ?? [], merchant.id)) {
      return NextResponse.json(
        { error: 'possible_duplicate', message: 'Already awarded — award again?' },
        { status: 409 },
      );
    }
  }

  const { points, gbpValuePence } = calculateEarn({
    basketPence,
    basePoints: town.base_points,
    multiplier,
    pointValuePence: town.point_value_pence,
  });

  const { data: ledgerRow, error } = await supabase.rpc('apply_ledger_entry', {
    p_town_id: pass.town_id,
    p_pass_id: passId,
    p_merchant_id: merchant.id,
    p_staff_id: merchantUserId,
    p_type: 'earn',
    p_points: points,
    p_gbp_value_pence: gbpValuePence,
    p_multiplier: multiplier,
    p_basket_pence: basketPence,
    p_reason: null,
    p_reverses_id: null,
  });
  if (error || !ledgerRow) {
    return NextResponse.json({ error: 'ledger_write_failed' }, { status: 500 });
  }

  const { data: updatedPass } = await supabase
    .from('passes')
    .select('balance_points')
    .eq('id', passId)
    .single();

  // No push target until the shopper has actually added the pass to a
  // wallet (platform is null until then — see /api/pass).
  if (pass.platform) await pushPassUpdate({ passId, platform: pass.platform, serial: pass.serial });

  return NextResponse.json({
    points,
    multiplier,
    balancePoints: updatedPass?.balance_points ?? null,
    ledgerId: (ledgerRow as { id: string }).id,
  });
}
