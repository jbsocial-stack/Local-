import { describe, expect, it } from 'vitest';
import { calculateEarn, calculateRedeem, formatPence } from '../../src/lib/ledger/points';

describe('calculateEarn', () => {
  it('matches the R3 AC: £12.40 at 3x with base_points=1 -> 37 points', () => {
    const result = calculateEarn({
      basketPence: 1240,
      basePoints: 1,
      multiplier: 3,
      pointValuePence: 1,
    });
    expect(result.points).toBe(37);
    expect(result.gbpValuePence).toBe(37);
  });

  it('floors fractional points rather than rounding', () => {
    const result = calculateEarn({
      basketPence: 999,
      basePoints: 1,
      multiplier: 1,
      pointValuePence: 1,
    });
    expect(result.points).toBe(9);
  });

  it('rejects a multiplier outside 1-5', () => {
    expect(() =>
      calculateEarn({ basketPence: 100, basePoints: 1, multiplier: 6, pointValuePence: 1 }),
    ).toThrow();
    expect(() =>
      calculateEarn({ basketPence: 100, basePoints: 1, multiplier: 0, pointValuePence: 1 }),
    ).toThrow();
  });

  it('rejects a negative basket', () => {
    expect(() =>
      calculateEarn({ basketPence: -1, basePoints: 1, multiplier: 1, pointValuePence: 1 }),
    ).toThrow();
  });
});

describe('calculateRedeem', () => {
  it('matches the R4 AC: balance 1500, request £20 -> rejected, £15.00 available', () => {
    const result = calculateRedeem({
      requestedPence: 2000,
      balancePoints: 1500,
      pointValuePence: 1,
    });
    expect(result).toEqual({ ok: false, reason: 'insufficient_balance', availablePence: 1500 });
    expect(result.ok === false && formatPence(result.availablePence)).toBe('£15.00');
  });

  it('allows redeeming exactly the full balance', () => {
    const result = calculateRedeem({
      requestedPence: 1500,
      balancePoints: 1500,
      pointValuePence: 1,
    });
    expect(result).toEqual({ ok: true, points: 1500, gbpValuePence: 1500 });
  });

  it('rejects a non-positive request', () => {
    expect(() =>
      calculateRedeem({ requestedPence: 0, balancePoints: 100, pointValuePence: 1 }),
    ).toThrow();
  });
});
