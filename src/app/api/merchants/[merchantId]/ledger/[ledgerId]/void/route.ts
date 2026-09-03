import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';

interface Params {
  merchantId: string;
  ledgerId: string;
}

// R10: "void a transaction ... (owner only, writes reversal row)."
export async function POST(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId, ledgerId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  const { data: original } = await supabase
    .from('ledger')
    .select('id, town_id, pass_id, points, merchant_id')
    .eq('id', ledgerId)
    .eq('merchant_id', merchantId)
    .maybeSingle();
  if (!original) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: alreadyVoided } = await supabase
    .from('ledger')
    .select('id')
    .eq('reverses_id', original.id)
    .maybeSingle();
  if (alreadyVoided) {
    return NextResponse.json({ error: 'already_voided' }, { status: 409 });
  }

  const { data: reversal, error } = await supabase.rpc('apply_ledger_entry', {
    p_town_id: original.town_id,
    p_pass_id: original.pass_id,
    p_merchant_id: original.merchant_id,
    p_staff_id: null,
    p_type: 'reversal',
    p_points: -original.points,
    p_gbp_value_pence: Math.abs(original.points),
    p_multiplier: null,
    p_basket_pence: null,
    p_reason: 'Voided by owner',
    p_reverses_id: original.id,
  });
  if (error || !reversal) {
    // A void that would take the pass balance negative (points already
    // spent elsewhere) is rejected by apply_ledger_entry's own balance
    // check — surfaced here rather than silently corrupting the ledger.
    return NextResponse.json({ error: 'void_failed', message: String(error?.message ?? '') }, { status: 409 });
  }

  return NextResponse.json({ reversal });
}
