// Offers tab: "a complete list of offers (like double points etc) — a
// deals page." Built entirely from data merchants already manage in their
// settings (base multiplier + scheduled boosts) — no new merchant-side
// concept of an "offer" needed.
export interface OfferMerchant {
  id: string;
  name: string;
  slug: string;
  baseMultiplier: number;
}

export interface OfferBoost {
  merchantId: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  label: string | null;
}

export type OfferKind = 'boost-active' | 'boost-upcoming' | 'standing';

export interface Offer {
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  multiplier: number;
  label: string;
  kind: OfferKind;
  startsAt?: string;
  endsAt?: string;
}

export function buildOffers(merchants: OfferMerchant[], boosts: OfferBoost[], now: Date = new Date()): Offer[] {
  const merchantsById = new Map(merchants.map((m) => [m.id, m]));
  const offers: Offer[] = [];

  for (const boost of boosts) {
    const merchant = merchantsById.get(boost.merchantId);
    if (!merchant) continue;
    const start = new Date(boost.startsAt);
    const end = new Date(boost.endsAt);
    if (end <= now) continue; // already finished — not an offer any more
    offers.push({
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantSlug: merchant.slug,
      multiplier: boost.multiplier,
      label: boost.label || `${boost.multiplier}x points`,
      kind: start <= now ? 'boost-active' : 'boost-upcoming',
      startsAt: boost.startsAt,
      endsAt: boost.endsAt,
    });
  }

  for (const merchant of merchants) {
    if (merchant.baseMultiplier > 1) {
      offers.push({
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantSlug: merchant.slug,
        multiplier: merchant.baseMultiplier,
        label: `Always ${merchant.baseMultiplier}x points`,
        kind: 'standing',
      });
    }
  }

  const kindOrder: Record<OfferKind, number> = { 'boost-active': 0, standing: 1, 'boost-upcoming': 2 };
  return offers.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || b.multiplier - a.multiplier);
}
