import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';

interface Params {
  townId: string;
}

// R11: "set town defaults (point_value, base_points, expiry months)."
const bodySchema = z.object({
  pointValuePence: z.number().int().min(1).optional(),
  basePoints: z.number().int().min(0).optional(),
  expiryMonths: z.number().int().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { townId } = await params;
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('towns')
    .update({
      point_value_pence: parsed.data.pointValuePence,
      base_points: parsed.data.basePoints,
      expiry_months: parsed.data.expiryMonths,
    })
    .eq('id', townId)
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ town: data });
}
