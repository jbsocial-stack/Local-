import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { claimPassForUser } from '@/lib/account/claim';

// Client-driven counterpart to /auth/callback's passId handling — used by
// the password claim path, which establishes a session directly in the
// browser (no redirect round-trip) and then needs to link the pass itself.
const bodySchema = z.object({ passId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });
  }

  const result = await claimPassForUser(parsed.data.passId, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
