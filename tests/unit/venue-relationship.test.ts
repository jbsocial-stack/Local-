import { describe, expect, it } from 'vitest';
import { computeVenueRelationship, type VenueLedgerRow } from '../../src/lib/ledger/venue-relationship';

describe('computeVenueRelationship', () => {
  it('returns zeroed-out stats with no visits', () => {
    expect(computeVenueRelationship([])).toEqual({
      visits: 0,
      pointsEarned: 0,
      firstVisitAt: null,
      lastVisitAt: null,
    });
  });

  it('counts only earn rows as visits, ignoring redeem/expire/adjust', () => {
    const rows: VenueLedgerRow[] = [
      { type: 'earn', points: 40, created_at: '2026-01-01T10:00:00Z' },
      { type: 'redeem', points: -200, created_at: '2026-01-05T10:00:00Z' },
      { type: 'earn', points: 25, created_at: '2026-02-01T10:00:00Z' },
      { type: 'expire', points: -10, created_at: '2026-03-01T10:00:00Z' },
    ];
    expect(computeVenueRelationship(rows)).toEqual({
      visits: 2,
      pointsEarned: 65,
      firstVisitAt: '2026-01-01T10:00:00Z',
      lastVisitAt: '2026-02-01T10:00:00Z',
    });
  });

  it('finds first/last visit regardless of input order', () => {
    const rows: VenueLedgerRow[] = [
      { type: 'earn', points: 10, created_at: '2026-03-01T10:00:00Z' },
      { type: 'earn', points: 10, created_at: '2026-01-01T10:00:00Z' },
      { type: 'earn', points: 10, created_at: '2026-02-01T10:00:00Z' },
    ];
    const result = computeVenueRelationship(rows);
    expect(result.firstVisitAt).toBe('2026-01-01T10:00:00Z');
    expect(result.lastVisitAt).toBe('2026-03-01T10:00:00Z');
    expect(result.visits).toBe(3);
  });
});
