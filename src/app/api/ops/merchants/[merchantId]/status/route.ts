import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';

interface Params {
  merchantId: string;
}

// R11/R8: only `live` merchants ever appear in the public directory.
const bodySchema = z.object({ status: z.enum(['live', 'paused']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
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
    .from('merchants')
    .update({ status: parsed.data.status })
    .eq('id', merchantId)
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ merchant: data });
}
