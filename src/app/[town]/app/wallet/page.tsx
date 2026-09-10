import { redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { AddToWalletButtons } from '@/components/shopper/AddToWalletButtons';
import { FlippableWalletCard } from '@/components/shopper/FlippableWalletCard';
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
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Your wallet pass, always in your pocket
        </p>
        <FlippableWalletCard balancePoints={auth.pass.balancePoints} townName={townName} townSlug={town} />
        <p className="mt-2 text-center text-xs text-ink-muted">Tap your card to show your QR code</p>
        {!auth.pass.platform && <AddToWalletButtons town={town} />}

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">Activity</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-paper">
          {(rows ?? []).map((row) => {
            const merchantName = (row.merchants as unknown as { name: string } | null)?.name ?? 'Regulars';
            const positive = row.points > 0;
            return (
              <li key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{merchantName}</p>
                  <p className="text-xs text-ink-muted">
                    {TYPE_LABEL[row.type] ?? row.type} · {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`font-semibold ${positive ? 'text-success' : 'text-ink-muted'}`}>
                  {positive ? '+' : ''}
                  {row.points} pts
                </span>
              </li>
            );
          })}
          {(rows ?? []).length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink-muted">No activity yet — go earn some points.</li>
          )}
        </ul>
      </div>
    </main>
  );
}
