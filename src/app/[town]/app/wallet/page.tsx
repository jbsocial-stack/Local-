import { redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { formatPence } from '@/lib/ledger/points';

const TYPE_LABEL: Record<string, string> = {
  earn: 'Earned',
  redeem: 'Redeemed',
  expire: 'Expired',
  adjust: 'Adjusted',
  reversal: 'Reversed',
  mission: 'Bonus',
};

// Home tab: "their card and total amount of points accumulated... then
// underneath a list of all transactions they have earned points for and
// how many points (including when points are spent)."
export default async function WalletPage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const auth = await requireShopper(town);
  if (!auth.ok) {
    if (auth.reason === 'not_signed_in') redirect(`/${town}/app/sign-in`);
    return <NoPassMessage town={town} />;
  }

  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from('ledger')
    .select('id, type, points, gbp_value_pence, created_at, merchants(name)')
    .eq('pass_id', auth.pass.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md">
        <WalletCard balancePoints={auth.pass.balancePoints} platform={auth.pass.platform} />

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink/50">Activity</h2>
        <ul className="mt-3 divide-y divide-ink/10 rounded-xl bg-white shadow-sm">
          {(rows ?? []).map((row) => {
            const merchantName = (row.merchants as unknown as { name: string } | null)?.name ?? 'Local';
            const positive = row.points > 0;
            return (
              <li key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{merchantName}</p>
                  <p className="text-xs text-ink/50">
                    {TYPE_LABEL[row.type] ?? row.type} · {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`font-semibold ${positive ? 'text-green-700' : 'text-ink/70'}`}>
                  {positive ? '+' : ''}
                  {row.points} pts
                </span>
              </li>
            );
          })}
          {(rows ?? []).length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink/50">No activity yet — go earn some points.</li>
          )}
        </ul>
      </div>
    </main>
  );
}

function WalletCard({ balancePoints, platform }: { balancePoints: number; platform: string }) {
  return (
    <div className="rounded-3xl bg-coral p-6 text-cream shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl">Local</span>
        <span className="rounded-full bg-cream/20 px-3 py-1 text-xs uppercase">{platform} wallet</span>
      </div>
      <p className="mt-8 text-sm text-cream/80">Balance</p>
      <p className="font-display text-5xl">{formatPence(balancePoints)}</p>
      <p className="mt-1 text-sm text-cream/80">{balancePoints} points</p>
    </div>
  );
}
