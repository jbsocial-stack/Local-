export interface Boost {
  multiplier: number;
  starts_at: string;
  ends_at: string;
}

/**
 * R6: a scheduled boost applies only during its window; otherwise the
 * merchant's base multiplier applies. If multiple boosts overlap `now`
 * (shouldn't happen via the ops UI, but don't trust that), the highest wins.
 */
export function resolveActiveMultiplier(
  baseMultiplier: number,
  boosts: Boost[],
  now: Date = new Date(),
): number {
  const active = boosts.filter((b) => {
    const start = new Date(b.starts_at).getTime();
    const end = new Date(b.ends_at).getTime();
    const t = now.getTime();
    return t >= start && t < end;
  });
  if (active.length === 0) return baseMultiplier;
  return Math.max(baseMultiplier, ...active.map((b) => b.multiplier));
}
