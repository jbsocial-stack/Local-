import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';

// R11: "create a town."
const bodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only'),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from('towns').insert(parsed.data).select().single();
  if (error || !data) {
    return NextResponse.json({ error: 'create_failed', message: error?.message }, { status: 500 });
  }

  return NextResponse.json({ town: data }, { status: 201 });
}
