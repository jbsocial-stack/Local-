import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';
import { toCsv } from '@/lib/csv';

export async function GET() {
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from('merchant_leads')
    .select('business_name, contact_name, email, phone, town_slug, venues, category, notes, status, created_at')
    .order('created_at', { ascending: false });

  const csv = toCsv(
    ['business_name', 'contact_name', 'email', 'phone', 'town', 'venues', 'category', 'status', 'notes', 'created_at'],
    (rows ?? []).map((r) => [
      r.business_name,
      r.contact_name,
      r.email,
      r.phone,
      r.town_slug,
      r.venues,
      r.category,
      r.status,
      r.notes,
      r.created_at,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="regulars-business-leads.csv"',
    },
  });
}
