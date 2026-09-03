import { describe, expect, it } from 'vitest';
import { buildOffers, type OfferBoost, type OfferMerchant } from '../../src/lib/offers';

const NOW = new Date('2026-09-08T12:00:00Z');

const MERCHANTS: OfferMerchant[] = [
  { id: 'm1', name: 'The Roastery', slug: 'the-roastery', baseMultiplier: 2 },
  { id: 'm2', name: 'Book Co.', slug: 'book-co', baseMultiplier: 1 },
];

describe('buildOffers', () => {
  it('excludes a boost that has already ended', () => {
    const boosts: OfferBoost[] = [
      { merchantId: 'm2', multiplier: 3, startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-09-02T00:00:00Z', label: null },
    ];
    expect(buildOffers(MERCHANTS, boosts, NOW)).toHaveLength(1); // just m1's standing offer
  });

  it('classifies a currently-running boost as boost-active', () => {
    const boosts: OfferBoost[] = [
      { merchantId: 'm2', multiplier: 5, startsAt: '2026-09-08T00:00:00Z', endsAt: '2026-09-09T00:00:00Z', label: null },
    ];
    const offers = buildOffers(MERCHANTS, boosts, NOW);
    expect(offers.find((o) => o.merchantId === 'm2')?.kind).toBe('boost-active');
  });

  it('classifies a future boost as boost-upcoming', () => {
    const boosts: OfferBoost[] = [
      { merchantId: 'm2', multiplier: 5, startsAt: '2026-09-10T00:00:00Z', endsAt: '2026-09-11T00:00:00Z', label: null },
    ];
    const offers = buildOffers(MERCHANTS, boosts, NOW);
    expect(offers.find((o) => o.merchantId === 'm2')?.kind).toBe('boost-upcoming');
  });

  it('includes a "standing" offer for any merchant with base multiplier above 1x', () => {
    const offers = buildOffers(MERCHANTS, [], NOW);
    expect(offers).toEqual([
      {
        merchantId: 'm1',
        merchantName: 'The Roastery',
        merchantSlug: 'the-roastery',
        multiplier: 2,
        label: 'Always 2x points',
        kind: 'standing',
      },
    ]);
  });

  it('sorts active boosts first, then standing offers, then upcoming, each by multiplier desc', () => {
    const boosts: OfferBoost[] = [
      { merchantId: 'm2', multiplier: 5, startsAt: '2026-09-10T00:00:00Z', endsAt: '2026-09-11T00:00:00Z', label: null }, // upcoming
      { merchantId: 'm1', multiplier: 4, startsAt: '2026-09-08T00:00:00Z', endsAt: '2026-09-09T00:00:00Z', label: null }, // active
    ];
    const offers = buildOffers(MERCHANTS, boosts, NOW);
    expect(offers.map((o) => o.kind)).toEqual(['boost-active', 'standing', 'boost-upcoming']);
  });

  it('falls back to "Nx points" when a boost has no label', () => {
    const boosts: OfferBoost[] = [
      { merchantId: 'm2', multiplier: 3, startsAt: '2026-09-08T00:00:00Z', endsAt: '2026-09-09T00:00:00Z', label: null },
    ];
    expect(buildOffers(MERCHANTS, boosts, NOW).find((o) => o.merchantId === 'm2')?.label).toBe('3x points');
  });
});
