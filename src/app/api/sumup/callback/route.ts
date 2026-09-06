import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { exchangeCodeForToken, fetchSumUpMerchantCode, SUMUP_STATE_COOKIE } from '@/lib/sumup/oauth';

// A single static path, not /api/merchants/[merchantId]/sumup/callback —
// OAuth providers match `redirect_uri` exactly against whatever's
// registered for the app, so it can't vary per merchant. Which merchant
// this callback is for comes back through `state` instead (see
// connect/route.ts, which sets it to `${merchantId}.${random}`).
async function settingsRedirect(req: NextRequest, merchantId: string, status: 'connected' | 'error'): Promise<NextResponse> {
  const supabase = createServiceClient();
  const { data: merchant } = await supabase
    .from('merchants')
    .select('slug, towns(slug)')
    .eq('id', merchantId)
    .maybeSingle();
  const townSlug = (merchant?.towns as unknown as { slug: string } | null)?.slug;
  const target =
    merchant && townSlug
      ? `/m/${townSlug}/${merchant.slug}/settings?sumup=${status}`
      : '/m/dashboard';
  return NextResponse.redirect(new URL(target, req.url));
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expectedState = req.cookies.get(SUMUP_STATE_COOKIE)?.value;
  const merchantId = state?.split('.')[0];

  if (!code || !state || !merchantId || !expectedState || state !== expectedState) {
    // No merchantId to redirect to something more specific than this.
    return NextResponse.redirect(new URL('/m/dashboard', req.url));
  }

  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const sumupMerchantCode = await fetchSumUpMerchantCode(tokens.accessToken);

    const supabase = createServiceClient();
    const { error } = await supabase.from('merchant_sumup_connections').upsert(
      {
        merchant_id: merchantId,
        sumup_merchant_code: sumupMerchantCode,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
        connected_by: auth.merchantUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'merchant_id' },
    );
    if (error) {
      return settingsRedirect(req, merchantId, 'error');
    }

    const res = await settingsRedirect(req, merchantId, 'connected');
    res.cookies.delete(SUMUP_STATE_COOKIE);
    return res;
  } catch {
    return settingsRedirect(req, merchantId, 'error');
  }
}
