import { describe, expect, it } from 'vitest';
import { computeWaitlistStats, type WaitlistRow } from '../../src/lib/marketing/waitlist';

function row(referralCode: string, createdAt: string, referredByCode: string | null = null): WaitlistRow {
  return { referralCode, referredByCode, createdAt };
}

describe('computeWaitlistStats', () => {
  it('orders by signup time when nobody has referred anyone', () => {
    const rows = [row('a', '2026-01-03'), row('b', '2026-01-01'), row('c', '2026-01-02')];
    expect(computeWaitlistStats(rows, 'b')).toEqual({ position: 1, totalInQueue: 3, referredCount: 0 });
    expect(computeWaitlistStats(rows, 'c')).toEqual({ position: 2, totalInQueue: 3, referredCount: 0 });
    expect(computeWaitlistStats(rows, 'a')).toEqual({ position: 3, totalInQueue: 3, referredCount: 0 });
  });

  it('a later signup with referrals outranks an earlier one with none', () => {
    const rows = [
      row('early', '2026-01-01'),
      row('late', '2026-01-05'),
      row('friend1', '2026-01-06', 'late'),
      row('friend2', '2026-01-07', 'late'),
    ];
    const stats = computeWaitlistStats(rows, 'late');
    expect(stats).toEqual({ position: 1, totalInQueue: 4, referredCount: 2 });
  });

  it('ties on referral count are broken by earliest signup', () => {
    const rows = [row('a', '2026-01-02', 'ref'), row('b', '2026-01-01', 'ref2')];
    // Neither 'ref' nor 'ref2' are in the queue themselves — only a/b's own
    // referredCount (always 0 here) matters for their own ranking.
    expect(computeWaitlistStats(rows, 'b')?.position).toBe(1);
    expect(computeWaitlistStats(rows, 'a')?.position).toBe(2);
  });

  it('returns null when the code is not in the queue', () => {
    const rows = [row('a', '2026-01-01')];
    expect(computeWaitlistStats(rows, 'missing')).toBeNull();
  });
});
