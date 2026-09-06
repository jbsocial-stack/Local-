import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { buildAuthorizeUrl, SumUpCredentialsMissingError, SUMUP_STATE_COOKIE } from '@/lib/sumup/oauth';

interface Params {
  merchantId: string;
}

// Step 1 of the connection: send the owner to SumUp's own consent screen.
// `state` round-trips through SumUp and back to our callback so it can
// confirm this approval was actually requested by us, for this merchant,
// just now — not a forged callback hitting a stale or guessed URL.
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const auth = await requireOwner(merchantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const state = `${merchantId}.${randomBytes(16).toString('hex')}`;

  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizeUrl(state);
  } catch (err) {
    if (err instanceof SumUpCredentialsMissingError) {
      return NextResponse.json({ error: 'sumup_not_configured', message: err.message }, { status: 503 });
    }
    throw err;
  }

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(SUMUP_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });
  return res;
}
