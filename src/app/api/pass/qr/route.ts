import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createServiceClient } from '@/lib/supabase/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { generateToken, encodeQrPayload } from '@/lib/token/rotating-token';

// The in-app fallback for showing a pass without Apple/Google Wallet
// configured (a known blocker, see README): the wallet page's card flips
// over to reveal this same rotating QR code that a real wallet pass would
// show, which /api/scan/verify already understands — nothing merchant-side
// changes. Regenerated on every request rather than cached, since the
// token rotates every 60s (see rotating-token.ts).
export async function GET(req: NextRequest) {
  const townSlug = req.nextUrl.searchParams.get('town');
  if (!townSlug) {
    return NextResponse.json({ error: 'town_required' }, { status: 400 });
  }

  const authClient = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('id').eq('slug', townSlug).maybeSingle();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  const { data: pass } = await supabase
    .from('passes')
    .select('id, secret')
    .eq('user_id', user.id)
    .eq('town_id', town.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pass) {
    return NextResponse.json({ error: 'no_pass' }, { status: 404 });
  }

  const qrPayload = encodeQrPayload(generateToken(pass.secret, pass.id));
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 400,
    color: { dark: '#1a1a1a', light: '#ffffffff' },
  });

  return NextResponse.json({ qrDataUrl });
}
