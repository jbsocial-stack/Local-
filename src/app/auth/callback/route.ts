import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { claimPassForUser } from '@/lib/account/claim';

// Supabase Auth magic-link redirect target, shared by shopper claim (R9),
// merchant owner sign-in (R6), and ops sign-in (R11) — they all just need a
// session; only the shopper claim path also needs a follow-up write.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const passId = searchParams.get('passId');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  if (passId) {
    const result = await claimPassForUser(passId, data.user.id);
    if (!result.ok) {
      return NextResponse.redirect(`${origin}/auth/error?reason=${result.reason}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
