import { describe, expect, it } from 'vitest';
import { calculateDashboardStats, type DashboardLedgerRow } from '../../src/lib/ledger/dashboard-stats';

const NOW = new Date('2026-09-03T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('calculateDashboardStats', () => {
  it('counts visits within 7d and 30d windows separately', () => {
    const rows: DashboardLedgerRow[] = [
      { type: 'earn', points: 10, pass_id: 'p1', created_at: days(1) },
      { type: 'earn', points: 10, pass_id: 'p2', created_at: days(10) },
      { type: 'earn', points: 10, pass_id: 'p3', created_at: days(40) },
    ];
    const stats = calculateDashboardStats(rows, 1, NOW);
    expect(stats.visits7d).toBe(1);
    expect(stats.visits30d).toBe(2);
  });

  it('counts unique and repeat customers within 30d', () => {
    const rows: DashboardLedgerRow[] = [
      { type: 'earn', points: 10, pass_id: 'p1', created_at: days(1) },
      { type: 'earn', points: 10, pass_id: 'p1', created_at: days(5) },
      { type: 'earn', points: 10, pass_id: 'p2', created_at: days(2) },
    ];
    const stats = calculateDashboardStats(rows, 1, NOW);
    expect(stats.uniqueCustomers30d).toBe(2);
    expect(stats.repeatCustomers30d).toBe(1);
  });

  it('sums points issued and redeemed separately as positive counts', () => {
    const rows: DashboardLedgerRow[] = [
      { type: 'earn', points: 37, pass_id: 'p1', created_at: days(1) },
      { type: 'earn', points: 20, pass_id: 'p2', created_at: days(2) },
      { type: 'redeem', points: -15, pass_id: 'p1', created_at: days(1) },
    ];
    const stats = calculateDashboardStats(rows, 1, NOW);
    expect(stats.pointsIssued).toBe(57);
    expect(stats.pointsRedeemed).toBe(15);
  });

  it('net position equals the ledger sum for the merchant (AC)', () => {
    const rows: DashboardLedgerRow[] = [
      { type: 'earn', points: 100, pass_id: 'p1', created_at: days(1) },
      { type: 'redeem', points: -30, pass_id: 'p1', created_at: days(1) },
      { type: 'reversal', points: -20, pass_id: 'p1', created_at: days(1) },
    ];
    const ledgerSum = rows.reduce((sum, r) => sum + r.points, 0);
    const stats = calculateDashboardStats(rows, 1, NOW);
    expect(stats.netPositionPence).toBe(ledgerSum);
    expect(stats.netPositionPence).toBe(50);
  });

  it('applies point_value_pence to the net position', () => {
    const rows: DashboardLedgerRow[] = [{ type: 'earn', points: 100, pass_id: 'p1', created_at: days(1) }];
    const stats = calculateDashboardStats(rows, 2, NOW);
    expect(stats.netPositionPence).toBe(200);
  });
});
