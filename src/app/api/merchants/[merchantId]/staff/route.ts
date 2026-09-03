import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { hashPin } from '@/lib/auth/pin';

interface Params {
  merchantId: string;
}

// R7: "invite staff with a PIN-only login" — owner-only, no email/password.
const bodySchema = z.object({
  name: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('merchant_users')
    .select('id, name, role, email')
    .eq('merchant_id', merchantId)
    .order('role', { ascending: true });

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('merchant_users')
    .insert({
      merchant_id: merchantId,
      role: 'staff',
      name: parsed.data.name,
      pin_hash: hashPin(parsed.data.pin),
    })
    .select('id, name, role')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }

  return NextResponse.json({ staff: data }, { status: 201 });
}
