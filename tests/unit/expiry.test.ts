import { describe, expect, it } from 'vitest';
import { calculateExpiry } from '../../src/lib/ledger/expiry';

const CUTOFF = new Date('2026-01-01T00:00:00Z'); // "12 months ago" from "now"

describe('calculateExpiry', () => {
  it('expires an old, untouched earn in full', () => {
    const rows = [{ points: 100, created_at: '2025-01-01T00:00:00Z' }];
    expect(calculateExpiry(rows, CUTOFF)).toBe(100);
  });

  it('does not expire a recent earn', () => {
    const rows = [{ points: 100, created_at: '2026-06-01T00:00:00Z' }];
    expect(calculateExpiry(rows, CUTOFF)).toBe(0);
  });

  it('consumes the oldest lot first when a redeem happens in between', () => {
    const rows = [
      { points: 100, created_at: '2025-01-01T00:00:00Z' }, // old lot
      { points: 50, created_at: '2025-06-01T00:00:00Z' }, // old lot
      { points: -120, created_at: '2025-09-01T00:00:00Z' }, // redeem consumes FIFO
    ];
    // First lot (100) fully consumed, second lot (50) has 20 consumed -> 30 left, all pre-cutoff.
    expect(calculateExpiry(rows, CUTOFF)).toBe(30);
  });

  it('a redeem after the earn but before cutoff still lets remaining points expire', () => {
    const rows = [
      { points: 100, created_at: '2025-01-01T00:00:00Z' },
      { points: -40, created_at: '2025-02-01T00:00:00Z' },
    ];
    expect(calculateExpiry(rows, CUTOFF)).toBe(60);
  });

  it('a fully redeemed old lot expires nothing', () => {
    const rows = [
      { points: 100, created_at: '2025-01-01T00:00:00Z' },
      { points: -100, created_at: '2025-03-01T00:00:00Z' },
    ];
    expect(calculateExpiry(rows, CUTOFF)).toBe(0);
  });

  it('is idempotent: a prior expire row already consumed the old lot', () => {
    const rows = [
      { points: 100, created_at: '2025-01-01T00:00:00Z' },
      { points: -100, created_at: '2025-12-31T00:00:00Z' }, // last night's expiry run
    ];
    expect(calculateExpiry(rows, CUTOFF)).toBe(0);
  });

  it('handles a mix of old expired-eligible and new safe lots', () => {
    const rows = [
      { points: 100, created_at: '2025-01-01T00:00:00Z' }, // old, expires
      { points: 200, created_at: '2026-03-01T00:00:00Z' }, // new, safe
    ];
    expect(calculateExpiry(rows, CUTOFF)).toBe(100);
  });

  it('unsorted input is handled the same as sorted input', () => {
    const rows = [
      { points: -40, created_at: '2025-02-01T00:00:00Z' },
      { points: 100, created_at: '2025-01-01T00:00:00Z' },
    ];
    expect(calculateExpiry(rows, CUTOFF)).toBe(60);
  });
});
