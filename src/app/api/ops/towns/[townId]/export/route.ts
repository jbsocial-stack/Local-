import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOps } from '@/lib/auth/require-ops';
import { toCsv } from '@/lib/csv';

interface Params {
  townId: string;
}

// R11: "export data for the BID" — the full ledger for a town, merchant
// names resolved, newest first.
export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { townId } = await params;
  const auth = await requireOps();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.reason === 'not_signed_in' ? 401 : 403 });
  }

  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('slug').eq('id', townId).maybeSingle();
  if (!town) {
    return NextResponse.json({ error: 'town_not_found' }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from('ledger')
    .select('created_at, type, points, gbp_value_pence, pass_id, merchant_id, merchants(name)')
    .eq('town_id', townId)
    .order('created_at', { ascending: false });

  const csv = toCsv(
    ['created_at', 'type', 'points', 'gbp_value_pence', 'pass_id', 'merchant_name'],
    (rows ?? []).map((r) => [
      r.created_at,
      r.type,
      r.points,
      r.gbp_value_pence,
      r.pass_id,
      (r.merchants as unknown as { name: string } | null)?.name ?? null,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${town.slug}-ledger.csv"`,
    },
  });
}
