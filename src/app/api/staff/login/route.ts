import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth/pin';
import { createStaffSessionToken, STAFF_SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth/staff-session';

// R7: staff sign in on the merchant device with a merchant slug + 4-digit
// PIN only — no email/password. Owners get a full-scope session (dashboard +
// scanner); staff get scanner-only.
const bodySchema = z.object({
  merchantSlug: z.string().min(1),
  townSlug: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { merchantSlug, townSlug, pin } = parsed.data;

  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('id').eq('slug', townSlug).maybeSingle();
  if (!town) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, status')
    .eq('town_id', town.id)
    .eq('slug', merchantSlug)
    .maybeSingle();
  if (!merchant || merchant.status === 'pending') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: staffRows } = await supabase
    .from('merchant_users')
    .select('id, role, pin_hash')
    .eq('merchant_id', merchant.id)
    .not('pin_hash', 'is', null);

  const match = (staffRows ?? []).find((row) => row.pin_hash && verifyPin(pin, row.pin_hash));
  if (!match) {
    return NextResponse.json({ error: 'invalid_pin' }, { status: 401 });
  }

  const token = createStaffSessionToken({
    merchantUserId: match.id,
    merchantId: merchant.id,
    role: match.role,
    scope: match.role === 'owner' ? 'full' : 'scanner',
  });

  const res = NextResponse.json({ ok: true, role: match.role });
  res.cookies.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return res;
}
