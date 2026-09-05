import { describe, expect, it } from 'vitest';
import { formatTractionHeadline, type ShopperCounts } from '../../src/lib/marketing/shopper-count';

describe('formatTractionHeadline', () => {
  it('falls back to a launch-scarcity message when nobody has signed up yet', () => {
    const counts: ShopperCounts = { total: 0, byTown: [] };
    expect(formatTractionHeadline(counts)).toMatch(/first shops/);
  });

  it('names the town and uses singular wording for exactly one shopper', () => {
    const counts: ShopperCounts = { total: 1, byTown: [{ townSlug: 'chichester', townName: 'Chichester', count: 1 }] };
    expect(formatTractionHeadline(counts)).toBe('1 shopper is already earning points in Chichester.');
  });

  it('names the town and uses plural wording for more than one shopper', () => {
    const counts: ShopperCounts = {
      total: 247,
      byTown: [{ townSlug: 'chichester', townName: 'Chichester', count: 247 }],
    };
    expect(formatTractionHeadline(counts)).toBe('247 shoppers are already earning points in Chichester.');
  });

  it('reports a combined total across more than one live town', () => {
    const counts: ShopperCounts = {
      total: 300,
      byTown: [
        { townSlug: 'chichester', townName: 'Chichester', count: 200 },
        { townSlug: 'brighton', townName: 'Brighton', count: 100 },
      ],
    };
    expect(formatTractionHeadline(counts)).toBe('300 shoppers are already earning points across Local towns.');
  });
});
