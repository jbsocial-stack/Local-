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
    .from('signups')
    .select('email, town_slug, town_free_text, ref_code, consent_marketing, source, created_at')
    .order('created_at', { ascending: false });

  const csv = toCsv(
    ['email', 'town', 'referred', 'marketing_ok', 'source', 'created_at'],
    (rows ?? []).map((r) => [
      r.email,
      r.town_slug ?? r.town_free_text,
      r.ref_code ? 'yes' : 'no',
      r.consent_marketing ? 'yes' : 'no',
      r.source,
      r.created_at,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="regulars-waitlist.csv"',
    },
  });
}
