import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { generateToken, encodeQrPayload } from '@/lib/token/rotating-token';
import { generateApplePass, AppleCertificatesMissingError } from '@/lib/wallet/apple';
import { generateGoogleWalletSaveUrl, GoogleWalletCredentialsMissingError } from '@/lib/wallet/google';
import { formatLastActivity } from '@/lib/wallet/last-activity';
import { buildClaimUrl } from '@/lib/wallet/claim-url';

// R1: no-login onboarding. Creates an anonymous user + pass and returns a
// signed .pkpass (Apple) or a Save-to-Google-Wallet URL — no email/password
// is ever requested at this step.
const bodySchema = z.object({
  townSlug: z.string().min(1),
  platform: z.enum(['apple', 'google']),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { townSlug, platform } = parsed.data;

  const supabase = createServiceClient();
  const { data: town } = await supabase
    .from('towns')
    .select('id, name')
    .eq('slug', townSlug)
    .maybeSingle();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({})
    .select('id')
    .single();
  if (userError || !user) {
    return NextResponse.json({ error: 'user_create_failed' }, { status: 500 });
  }

  const serial = randomUUID();
  const secret = randomBytes(32).toString('hex');

  const { data: pass, error: passError } = await supabase
    .from('passes')
    .insert({
      user_id: user.id,
      town_id: town.id,
      platform,
      serial,
      secret,
      balance_points: 0,
    })
    .select('id, serial')
    .single();
  if (passError || !pass) {
    return NextResponse.json({ error: 'pass_create_failed' }, { status: 500 });
  }

  const qrPayload = encodeQrPayload(generateToken(secret, pass.id));
  const claimUrl = buildClaimUrl(req.nextUrl.origin, townSlug, pass.id);

  if (platform === 'apple') {
    try {
      const buffer = await generateApplePass({
        serial: pass.serial,
        authenticationToken: secret,
        townName: town.name,
        balancePoints: 0,
        lastActivityLabel: formatLastActivity(null),
        qrPayload,
        claimUrl,
      });
      return new NextResponse(new Uint8Array(buffer), {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="local-${townSlug}.pkpass"`,
          // Read by the client to link straight to /[town]/claim — the
          // pass's own back-field link only works once it's actually been
          // added to a real Apple Wallet, which isn't always possible
          // (desktop browsers, testing, non-Apple devices).
          'X-Pass-Id': pass.id,
        },
      });
    } catch (err) {
      if (err instanceof AppleCertificatesMissingError) {
        return NextResponse.json(
          { error: 'apple_wallet_not_configured', message: err.message, passId: pass.id },
          { status: 503 },
        );
      }
      throw err;
    }
  }

  try {
    const saveUrl = generateGoogleWalletSaveUrl({
      serial: pass.serial,
      townName: town.name,
      balancePoints: 0,
      lastActivityLabel: formatLastActivity(null),
      qrPayload,
      claimUrl,
    });
    return NextResponse.json({ passId: pass.id, saveUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof GoogleWalletCredentialsMissingError) {
      return NextResponse.json(
        { error: 'google_wallet_not_configured', message: err.message, passId: pass.id },
        { status: 503 },
      );
    }
    throw err;
  }
}
