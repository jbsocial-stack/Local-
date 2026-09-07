import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { generateToken, encodeQrPayload } from '@/lib/token/rotating-token';
import { generateApplePass, AppleCertificatesMissingError } from '@/lib/wallet/apple';
import { generateGoogleWalletSaveUrl, GoogleWalletCredentialsMissingError } from '@/lib/wallet/google';
import { formatLastActivity } from '@/lib/wallet/last-activity';
import { buildClaimUrl } from '@/lib/wallet/claim-url';

// Adds an *already signed-in* shopper's existing pass (created at signup —
// see /api/signup) to their Apple or Google Wallet. This is deliberately
// separate from account creation: whether Apple/Google Wallet is even
// configured on this deploy (a known blocker, see README) never gates
// signing up or seeing your balance, only this optional extra step.
const bodySchema = z.object({
  townSlug: z.string().min(1),
  platform: z.enum(['apple', 'google']),
});

export async function POST(req: NextRequest) {
  const authClient = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { townSlug, platform } = parsed.data;

  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('id, name').eq('slug', townSlug).maybeSingle();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  const { data: pass } = await supabase
    .from('passes')
    .select('id, serial, secret, balance_points')
    .eq('user_id', user.id)
    .eq('town_id', town.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pass) {
    return NextResponse.json({ error: 'no_pass' }, { status: 404 });
  }

  await supabase.from('passes').update({ platform }).eq('id', pass.id);

  const qrPayload = encodeQrPayload(generateToken(pass.secret, pass.id));
  const claimUrl = buildClaimUrl(req.nextUrl.origin, townSlug);

  if (platform === 'apple') {
    try {
      const buffer = await generateApplePass({
        serial: pass.serial,
        authenticationToken: pass.secret,
        townName: town.name,
        balancePoints: pass.balance_points,
        lastActivityLabel: formatLastActivity(null),
        qrPayload,
        claimUrl,
      });
      return new NextResponse(new Uint8Array(buffer), {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="regulars-${townSlug}.pkpass"`,
        },
      });
    } catch (err) {
      if (err instanceof AppleCertificatesMissingError) {
        return NextResponse.json({ error: 'apple_wallet_not_configured', message: err.message }, { status: 503 });
      }
      throw err;
    }
  }

  try {
    const saveUrl = generateGoogleWalletSaveUrl({
      serial: pass.serial,
      townName: town.name,
      balancePoints: pass.balance_points,
      lastActivityLabel: formatLastActivity(null),
      qrPayload,
      claimUrl,
    });
    return NextResponse.json({ saveUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof GoogleWalletCredentialsMissingError) {
      return NextResponse.json({ error: 'google_wallet_not_configured', message: err.message }, { status: 503 });
    }
    throw err;
  }
}
