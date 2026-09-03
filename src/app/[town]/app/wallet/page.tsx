import { redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { formatPence } from '@/lib/ledger/points';
import { findTown } from '../../../../../config/towns';

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
  const townName = findTown(town)?.name ?? town;

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
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">
          Your wallet pass, always in your pocket
        </p>
        <WalletCard balancePoints={auth.pass.balancePoints} townName={townName} />

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink/50">Activity</h2>
        <ul className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/60">
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

function WalletCard({ balancePoints, townName }: { balancePoints: number; townName: string }) {
  return (
    <div className="mt-3 rounded-3xl bg-gradient-to-br from-coral to-orange-400 p-6 text-cream shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cream/80">Local pass</span>
        <span className="rounded-full bg-accent-yellow px-3 py-1 text-xs font-semibold text-ink">{townName}</span>
      </div>
      <p className="mt-8 font-display text-5xl">
        {formatPence(balancePoints)}
        <span className="ml-2 font-body text-base font-normal text-cream/80">balance</span>
      </p>
      <p className="mt-1 text-sm text-cream/80">{balancePoints} points · ready to spend</p>

      <div className="mt-6 flex items-center gap-3 border-t border-cream/20 pt-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/20 text-sm font-semibold">
          L
        </span>
        <span className="text-sm text-cream/80">Tap to open in Apple or Google Wallet</span>
      </div>
    </div>
  );
}
