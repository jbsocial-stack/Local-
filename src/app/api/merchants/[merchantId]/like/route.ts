import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { createServiceClient } from '@/lib/supabase/server';

interface Params {
  merchantId: string;
}

// Toggle like: any signed-in shopper, identified from their own session —
// never a client-supplied user_id — same pattern as every other server-only
// write in this app.
export async function POST(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { merchantId } = await params;
  const authClient = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('merchant_likes')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('merchant_likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('merchant_likes').insert({ merchant_id: merchantId, user_id: user.id });
  }

  const { count } = await supabase
    .from('merchant_likes')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
