import { describe, expect, it } from 'vitest';
import { calculateTownStats } from '../../src/lib/ops/town-stats';

const NOW = new Date('2026-09-03T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('calculateTownStats', () => {
  it('passes through the pre-aggregated counts unchanged', () => {
    const stats = calculateTownStats(
      { passesIssued: 1000, merchantsLive: 40, outstandingBalancePoints: 5000, ledgerRows: [] },
      NOW,
    );
    expect(stats.passesIssued).toBe(1000);
    expect(stats.merchantsLive).toBe(40);
    expect(stats.pointsOutstanding).toBe(5000);
  });

  it('counts distinct earners within the last 30 days only', () => {
    const stats = calculateTownStats(
      {
        passesIssued: 10,
        merchantsLive: 2,
        outstandingBalancePoints: 0,
        ledgerRows: [
          { type: 'earn', pass_id: 'p1', basket_pence: 500, created_at: daysAgo(1) },
          { type: 'earn', pass_id: 'p1', basket_pence: 500, created_at: daysAgo(5) },
          { type: 'earn', pass_id: 'p2', basket_pence: 500, created_at: daysAgo(2) },
          { type: 'earn', pass_id: 'p3', basket_pence: 500, created_at: daysAgo(45) },
        ],
      },
      NOW,
    );
    expect(stats.activeEarners30d).toBe(2);
  });

  it('sums basket_pence across earns only as the GMV proxy', () => {
    const stats = calculateTownStats(
      {
        passesIssued: 10,
        merchantsLive: 2,
        outstandingBalancePoints: 0,
        ledgerRows: [
          { type: 'earn', pass_id: 'p1', basket_pence: 1240, created_at: daysAgo(1) },
          { type: 'earn', pass_id: 'p2', basket_pence: 2000, created_at: daysAgo(1) },
          { type: 'redeem', pass_id: 'p1', basket_pence: null, created_at: daysAgo(1) },
        ],
      },
      NOW,
    );
    expect(stats.gmvProxyPence).toBe(3240);
  });
});
