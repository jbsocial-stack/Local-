import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';

interface Params {
  leadId: string;
}

const bodySchema = z.object({ status: z.enum(['new', 'contacted', 'trial', 'live', 'lost']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { leadId } = await params;
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('merchant_leads')
    .update({ status: parsed.data.status })
    .eq('id', leadId)
    .select('id, business_name, contact_name, email, phone, town_slug, venues, category, notes, status, created_at')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
}
