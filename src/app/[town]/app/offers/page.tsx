import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { createServiceClient } from '@/lib/supabase/server';
import { getTownBySlug } from '@/lib/towns/get-town';
import { buildOffers } from '@/lib/offers';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';

const KIND_TAG: Record<string, string> = {
  'boost-active': 'Live now',
  standing: 'Always on',
  'boost-upcoming': 'Coming up',
};

export default async function OffersPage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const auth = await requireShopper(town);
  if (!auth.ok) {
    if (auth.reason === 'not_signed_in') redirect(`/${town}/app/sign-in`);
    return <NoPassMessage town={town} />;
  }

  const townRow = await getTownBySlug(town);
  if (!townRow) notFound();

  const supabase = createServiceClient();

  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, name, slug, base_multiplier')
    .eq('town_id', townRow.id)
    .eq('status', 'live');

  const merchantIds = (merchants ?? []).map((m) => m.id);
  const { data: boosts } =
    merchantIds.length > 0
      ? await supabase
          .from('merchant_boosts')
          .select('merchant_id, multiplier, starts_at, ends_at, label')
          .in('merchant_id', merchantIds)
      : { data: [] };

  const offers = buildOffers(
    (merchants ?? []).map((m) => ({ id: m.id, name: m.name, slug: m.slug, baseMultiplier: m.base_multiplier })),
    (boosts ?? []).map((b) => ({
      merchantId: b.merchant_id,
      multiplier: b.multiplier,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      label: b.label,
    })),
  );

  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl">Offers</h1>
        <p className="text-sm text-ink-muted">Boosted points and standing deals across town.</p>

        <ul className="mt-4 space-y-2">
          {offers.map((offer, i) => (
            <li key={i}>
              <Link
                href={`/${town}/app/discover/${offer.merchantSlug}`}
                className="flex items-center justify-between rounded-2xl bg-paper p-4"
              >
                <div>
                  <p className="font-medium">{offer.merchantName}</p>
                  <p className="text-sm text-ink-muted">{offer.label}</p>
                </div>
                <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">
                  {KIND_TAG[offer.kind]}
                </span>
              </Link>
            </li>
          ))}
          {offers.length === 0 && (
            <li className="rounded-2xl bg-paper p-6 text-center text-sm text-ink-muted">
              No offers right now — check back soon.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
