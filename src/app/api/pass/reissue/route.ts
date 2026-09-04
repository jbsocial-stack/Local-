import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { generateToken, encodeQrPayload } from '@/lib/token/rotating-token';
import { generateApplePass, AppleCertificatesMissingError } from '@/lib/wallet/apple';
import { generateGoogleWalletSaveUrl, GoogleWalletCredentialsMissingError } from '@/lib/wallet/google';
import { formatLastActivity } from '@/lib/wallet/last-activity';
import { buildClaimUrl } from '@/lib/wallet/claim-url';

// R9: "supports pass re-issue to a new device; old pass token revoked" —
// only reachable once a shopper has claimed their account (R9's email
// claim), since we need to know which existing pass is theirs.
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

  const { data: oldPass } = await supabase
    .from('passes')
    .select('id, balance_points')
    .eq('user_id', user.id)
    .eq('town_id', town.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!oldPass) {
    return NextResponse.json({ error: 'no_existing_pass' }, { status: 404 });
  }

  const serial = randomUUID();
  const secret = randomBytes(32).toString('hex');
  const { data: newPass, error: newPassError } = await supabase
    .from('passes')
    .insert({ user_id: user.id, town_id: town.id, platform, serial, secret, balance_points: 0 })
    .select('id, serial')
    .single();
  if (newPassError || !newPass) {
    return NextResponse.json({ error: 'pass_create_failed' }, { status: 500 });
  }

  // Revoke first: if the transfer below fails partway, the old pass can
  // never be scanned again, so points can never be double-spent even if a
  // retry creates a second new pass.
  await supabase.from('passes').update({ revoked_at: new Date().toISOString() }).eq('id', oldPass.id);

  if (oldPass.balance_points > 0) {
    await supabase.rpc('apply_ledger_entry', {
      p_town_id: town.id,
      p_pass_id: oldPass.id,
      p_merchant_id: null,
      p_staff_id: null,
      p_type: 'adjust',
      p_points: -oldPass.balance_points,
      p_gbp_value_pence: oldPass.balance_points,
      p_multiplier: null,
      p_basket_pence: null,
      p_reason: `Device re-issue: transferred to pass ${newPass.id}`,
      p_reverses_id: null,
    });
    await supabase.rpc('apply_ledger_entry', {
      p_town_id: town.id,
      p_pass_id: newPass.id,
      p_merchant_id: null,
      p_staff_id: null,
      p_type: 'adjust',
      p_points: oldPass.balance_points,
      p_gbp_value_pence: oldPass.balance_points,
      p_multiplier: null,
      p_basket_pence: null,
      p_reason: `Device re-issue: transferred from pass ${oldPass.id}`,
      p_reverses_id: null,
    });
  }

  const { data: finalPass } = await supabase
    .from('passes')
    .select('balance_points')
    .eq('id', newPass.id)
    .single();
  const balancePoints = finalPass?.balance_points ?? 0;

  const qrPayload = encodeQrPayload(generateToken(secret, newPass.id));
  const claimUrl = buildClaimUrl(req.nextUrl.origin, townSlug);

  if (platform === 'apple') {
    try {
      const buffer = await generateApplePass({
        serial: newPass.serial,
        authenticationToken: secret,
        townName: town.name,
        balancePoints,
        lastActivityLabel: formatLastActivity(null),
        qrPayload,
        claimUrl,
      });
      return new NextResponse(new Uint8Array(buffer), {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="local-${townSlug}.pkpass"`,
        },
      });
    } catch (err) {
      if (err instanceof AppleCertificatesMissingError) {
        return NextResponse.json(
          { error: 'apple_wallet_not_configured', message: err.message, passId: newPass.id },
          { status: 503 },
        );
      }
      throw err;
    }
  }

  try {
    const saveUrl = generateGoogleWalletSaveUrl({
      serial: newPass.serial,
      townName: town.name,
      balancePoints,
      lastActivityLabel: formatLastActivity(null),
      qrPayload,
      claimUrl,
    });
    return NextResponse.json({ passId: newPass.id, saveUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof GoogleWalletCredentialsMissingError) {
      return NextResponse.json(
        { error: 'google_wallet_not_configured', message: err.message, passId: newPass.id },
        { status: 503 },
      );
    }
    throw err;
  }
}
