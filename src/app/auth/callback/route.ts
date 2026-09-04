import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';

// Supabase Auth magic-link redirect target, shared by password reset,
// merchant owner sign-in (R6), ops sign-in (R11), and shopper pass reissue
// — they all just need a session established from the emailed link.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await createRouteHandlerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
