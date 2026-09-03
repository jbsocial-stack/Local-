import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { decodeQrPayload, verifyToken } from '@/lib/token/rotating-token';
import { requireStaffSession } from '@/lib/auth/require-staff';

const bodySchema = z.object({ payload: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requireStaffSession();
  if ('error' in auth) return auth.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const decoded = decodeQrPayload(parsed.data.payload);
  if (!decoded) {
    return NextResponse.json({ error: 'invalid_qr' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: pass } = await supabase
    .from('passes')
    .select('id, secret, balance_points, revoked_at, user_id, town_id')
    .eq('id', decoded.passId)
    .maybeSingle();

  if (!pass || pass.revoked_at) {
    return NextResponse.json({ error: 'pass_not_found' }, { status: 404 });
  }

  // R2 AC: a QR older than 5 minutes fails with a prompt to refresh the pass.
  const result = verifyToken(pass.secret, pass.id, decoded.step, decoded.token);
  if (!result.valid) {
    if (result.reason === 'expired') {
      return NextResponse.json(
        { error: 'expired', message: 'Ask the customer to refresh their pass' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', pass.user_id)
    .maybeSingle();

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count: earnsThisMonth } = await supabase
    .from('ledger')
    .select('id', { count: 'exact', head: true })
    .eq('pass_id', pass.id)
    .eq('merchant_id', auth.session.merchantId)
    .eq('type', 'earn')
    .gte('created_at', monthStart.toISOString());

  return NextResponse.json({
    passId: pass.id,
    balancePoints: pass.balance_points,
    displayName: user?.display_name ?? null,
    // R3: "3rd visit this month" — this scan would be the next one.
    visitNumberThisMonth: (earnsThisMonth ?? 0) + 1,
  });
}
