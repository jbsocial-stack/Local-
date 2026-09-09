import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOps } from '@/lib/auth/require-ops';
import { createServiceClient } from '@/lib/supabase/server';
import { calculateTownStats } from '@/lib/ops/town-stats';
import { MerchantsPanel } from './MerchantsPanel';
import { TownDefaultsForm } from './TownDefaultsForm';
import { AdjustBalanceForm } from './AdjustBalanceForm';

export default async function OpsTownPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: townSlug } = await params;
  const auth = await requireOps();
  if (!auth.ok) redirect('/ops/login');

  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('*').eq('slug', townSlug).maybeSingle();
  if (!town) redirect('/ops');

  const [{ data: merchants }, { count: passesIssued }, { data: passBalances }, { data: ledgerRows }] =
    await Promise.all([
      supabase.from('merchants').select('*').eq('town_id', town.id).order('name'),
      supabase.from('passes').select('id', { count: 'exact', head: true }).eq('town_id', town.id),
      supabase.from('passes').select('balance_points').eq('town_id', town.id).is('revoked_at', null),
      supabase
        .from('ledger')
        .select('type, pass_id, basket_pence, created_at')
        .eq('town_id', town.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

  const stats = calculateTownStats({
    passesIssued: passesIssued ?? 0,
    merchantsLive: (merchants ?? []).filter((m) => m.status === 'live').length,
    outstandingBalancePoints: (passBalances ?? []).reduce((sum, p) => sum + p.balance_points, 0),
    ledgerRows: ledgerRows ?? [],
  });

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/ops" className="text-sm text-ink-muted">
            ← Ops console
          </Link>
          <div className="mt-1 flex items-center justify-between">
            <h1 className="text-xl font-bold text-ink">{town.name}</h1>
            <a
              href={`/api/ops/towns/${town.id}/export`}
              className="flex h-9 items-center rounded-full border-[1.5px] border-ink px-4 text-sm text-ink transition-colors duration-150 hover:bg-ink/5"
            >
              Export CSV
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Passes issued" value={stats.passesIssued} />
          <StatCard label="Merchants live" value={stats.merchantsLive} />
          <StatCard label="Active earners (30d)" value={stats.activeEarners30d} />
          <StatCard label="GMV proxy (30d)" value={`£${(stats.gmvProxyPence / 100).toFixed(2)}`} />
          <StatCard label="Points outstanding" value={stats.pointsOutstanding} />
        </div>

        <TownDefaultsForm town={town} />
        <MerchantsPanel townId={town.id} merchants={merchants ?? []} />
        <AdjustBalanceForm />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-display text-ink">{value}</p>
    </div>
  );
}
