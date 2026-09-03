import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';

interface Params {
  merchantId: string;
}

// R6: "set my earn multiplier and schedule a boosted period."
const bodySchema = z
  .object({
    multiplier: z.number().int().min(1).max(5),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    label: z.string().nullable().optional(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'endsAt must be after startsAt',
  });

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('merchant_boosts')
    .insert({
      merchant_id: merchantId,
      multiplier: parsed.data.multiplier,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      label: parsed.data.label ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }

  return NextResponse.json({ boost: data }, { status: 201 });
}
