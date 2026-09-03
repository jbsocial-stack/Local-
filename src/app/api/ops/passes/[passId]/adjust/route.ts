import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';

interface Params {
  passId: string;
}

// R11: "void a transaction and adjust a balance with a reason, so fraud or
// mistakes can be fixed." `points` may be negative.
const bodySchema = z.object({
  points: z.number().int().refine((v) => v !== 0, 'points must not be zero'),
  reason: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { passId } = await params;
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: pass } = await supabase.from('passes').select('id, town_id').eq('id', passId).maybeSingle();
  if (!pass) {
    return NextResponse.json({ error: 'pass_not_found' }, { status: 404 });
  }

  const { data: entry, error } = await supabase.rpc('apply_ledger_entry', {
    p_town_id: pass.town_id,
    p_pass_id: pass.id,
    p_merchant_id: null,
    p_staff_id: null,
    p_type: 'adjust',
    p_points: parsed.data.points,
    p_gbp_value_pence: Math.abs(parsed.data.points),
    p_multiplier: null,
    p_basket_pence: null,
    p_reason: parsed.data.reason,
    p_reverses_id: null,
  });
  if (error || !entry) {
    return NextResponse.json({ error: 'adjust_failed', message: String(error?.message ?? '') }, { status: 409 });
  }

  return NextResponse.json({ entry });
}
