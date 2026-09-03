import { describe, expect, it } from 'vitest';
import { resolveActiveMultiplier } from '../../src/lib/ledger/multiplier';

describe('resolveActiveMultiplier', () => {
  it('uses the base multiplier when no boost is scheduled', () => {
    expect(resolveActiveMultiplier(2, [])).toBe(2);
  });

  it('uses the boost multiplier only inside its window (R6 AC)', () => {
    const tuesdayBoost = {
      multiplier: 3,
      starts_at: '2026-09-08T00:00:00Z',
      ends_at: '2026-09-09T00:00:00Z',
    };
    expect(
      resolveActiveMultiplier(1, [tuesdayBoost], new Date('2026-09-08T12:00:00Z')),
    ).toBe(3);
    expect(
      resolveActiveMultiplier(1, [tuesdayBoost], new Date('2026-09-10T12:00:00Z')),
    ).toBe(1);
  });

  it('window end is exclusive', () => {
    const boost = {
      multiplier: 4,
      starts_at: '2026-09-08T00:00:00Z',
      ends_at: '2026-09-09T00:00:00Z',
    };
    expect(resolveActiveMultiplier(1, [boost], new Date('2026-09-09T00:00:00Z'))).toBe(1);
  });

  it('picks the higher multiplier when boosts overlap', () => {
    const boosts = [
      { multiplier: 2, starts_at: '2026-09-08T00:00:00Z', ends_at: '2026-09-09T00:00:00Z' },
      { multiplier: 5, starts_at: '2026-09-08T06:00:00Z', ends_at: '2026-09-08T18:00:00Z' },
    ];
    expect(resolveActiveMultiplier(1, boosts, new Date('2026-09-08T12:00:00Z'))).toBe(5);
  });
});
