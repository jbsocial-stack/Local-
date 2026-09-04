import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireStaffSession } from '@/lib/auth/require-staff';
import { calculateRedeem, formatPence } from '@/lib/ledger/points';
import { pushPassUpdate } from '@/lib/wallet/push';

// R4: every merchant must accept redemption, no minimum spend or exclusions.
// The merchant applies the discount at their own till manually — this route
// only debits the ledger and returns the £ value for them to key in.
const bodySchema = z.object({
  passId: z.string().uuid(),
  requestedPence: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaffSession();
  if ('error' in auth) return auth.error;
  const { merchantId, merchantUserId } = auth.session;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { passId, requestedPence } = parsed.data;

  const supabase = createServiceClient();

  const { data: pass } = await supabase
    .from('passes')
    .select('id, town_id, platform, serial, balance_points, revoked_at')
    .eq('id', passId)
    .maybeSingle();
  if (!pass || pass.revoked_at) {
    return NextResponse.json({ error: 'pass_not_found' }, { status: 404 });
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, town_id, status')
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
    .select('point_value_pence')
    .eq('id', pass.town_id)
    .single();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  // R4 AC: balance 1500, request £20 -> rejected with the actual amount available.
  const calc = calculateRedeem({
    requestedPence,
    balancePoints: pass.balance_points,
    pointValuePence: town.point_value_pence,
  });
  if (!calc.ok) {
    return NextResponse.json(
      {
        error: 'insufficient_balance',
        message: `Customer has ${formatPence(calc.availablePence)} available`,
        availablePence: calc.availablePence,
      },
      { status: 409 },
    );
  }

  const { data: ledgerRow, error } = await supabase.rpc('apply_ledger_entry', {
    p_town_id: pass.town_id,
    p_pass_id: passId,
    p_merchant_id: merchant.id,
    p_staff_id: merchantUserId,
    p_type: 'redeem',
    p_points: -calc.points,
    p_gbp_value_pence: calc.gbpValuePence,
    p_multiplier: null,
    p_basket_pence: null,
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
  if (pass.platform) {
    await pushPassUpdate({
      passId,
      platform: pass.platform,
      serial: pass.serial,
      balancePoints: updatedPass?.balance_points ?? 0,
    });
  }

  return NextResponse.json({
    points: calc.points,
    gbpValuePence: calc.gbpValuePence,
    balancePoints: updatedPass?.balance_points ?? null,
    ledgerId: (ledgerRow as { id: string }).id,
  });
}
