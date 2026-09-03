import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { createServiceClient } from '@/lib/supabase/server';

// Email is deliberately not editable here — changing it needs Supabase
// Auth's own confirm-both-addresses flow (supabase.auth.updateUser), which
// is a separate, larger piece of UX than this profile form covers today.
const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
});

export async function PATCH(req: NextRequest) {
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

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update({
      display_name: parsed.data.displayName,
      phone: parsed.data.phone,
    })
    .eq('id', user.id)
    .select('display_name, phone, avatar_url, email')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
