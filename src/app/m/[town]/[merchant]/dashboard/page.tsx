import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { calculateDashboardStats } from '@/lib/ledger/dashboard-stats';
import { formatPence } from '@/lib/ledger/points';
import { TransactionsTable } from './TransactionsTable';

export default async function MerchantDashboardPage({
  params,
}: {
  params: Promise<{ town: string; merchant: string }>;
}) {
  const { town, merchant: merchantSlug } = await params;
  const supabase = createServiceClient();

  const { data: townRow } = await supabase.from('towns').select('id, point_value_pence').eq('slug', town).maybeSingle();
  if (!townRow) redirect('/');

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, name')
    .eq('town_id', townRow.id)
    .eq('slug', merchantSlug)
    .maybeSingle();
  if (!merchant) redirect('/');

  const auth = await requireOwner(merchant.id);
  if (!auth.ok) redirect(`/m/${town}/${merchantSlug}/owner-login`);

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from('ledger')
    .select('id, type, points, gbp_value_pence, pass_id, staff_id, created_at')
    .eq('merchant_id', merchant.id)
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: false });

  const stats = calculateDashboardStats(rows ?? [], townRow.point_value_pence);

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold text-coral">{merchant.name} — dashboard</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Visits (7d)" value={stats.visits7d} />
          <StatCard label="Visits (30d)" value={stats.visits30d} />
          <StatCard label="Unique customers (30d)" value={stats.uniqueCustomers30d} />
          <StatCard label="Repeat customers (30d)" value={stats.repeatCustomers30d} />
          <StatCard label="Points issued" value={stats.pointsIssued} />
          <StatCard label="Points redeemed" value={stats.pointsRedeemed} />
          <StatCard label="Net position" value={formatPence(stats.netPositionPence)} span />
        </div>

        <h2 className="mt-8 font-semibold">Recent transactions</h2>
        <TransactionsTable merchantId={merchant.id} rows={(rows ?? []).slice(0, 50)} />
      </div>
    </main>
  );
}

function StatCard({ label, value, span }: { label: string; value: string | number; span?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow ${span ? 'col-span-2 sm:col-span-3' : ''}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-coral">{value}</p>
    </div>
  );
}
