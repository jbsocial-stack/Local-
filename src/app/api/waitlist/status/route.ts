import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { computeWaitlistStats, fetchTownQueue } from '@/lib/marketing/waitlist';

// Lets the shopper form re-check a queue position after the page reloads
// (e.g. after a friend follows their referral link) without re-submitting
// the signup form. `code` is the referral_code a signup got back from
// /api/signup.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code_required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: me } = await supabase
    .from('signups')
    .select('town_slug, town_free_text')
    .eq('referral_code', code)
    .maybeSingle();
  if (!me) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const rows = await fetchTownQueue(supabase, me.town_slug, me.town_free_text);
  const stats = computeWaitlistStats(rows, code);
  if (!stats) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json(stats);
}
