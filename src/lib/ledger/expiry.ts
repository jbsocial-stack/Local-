// R5: points expire 12 months after issue, FIFO. This is pure and
// idempotent — given the full ledger history for one pass and a cutoff
// date, it returns exactly the points that are newly eligible to expire
// *right now*, having already accounted for every previous expire/redeem/
// adjustment row as FIFO consumption against the earn lots that funded them.
//
// No Node-specific APIs here so it can run both in the Next.js server
// runtime (imported normally) and in the Supabase Edge Function (Deno,
// imported by relative path) without a build step.
export interface LedgerRowForExpiry {
  points: number;
  created_at: string; // ISO timestamp
}

export function calculateExpiry(rows: LedgerRowForExpiry[], cutoff: Date): number {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // FIFO queue of still-live positive lots (earns, mission bonuses, positive
  // adjustments/reversals) with however many of their points remain
  // unconsumed by later redeems/expiries/negative adjustments.
  const lots: { remaining: number; created_at: string }[] = [];

  for (const row of sorted) {
    if (row.points > 0) {
      lots.push({ remaining: row.points, created_at: row.created_at });
      continue;
    }
    let toConsume = -row.points;
    for (const lot of lots) {
      if (toConsume <= 0) break;
      const take = Math.min(lot.remaining, toConsume);
      lot.remaining -= take;
      toConsume -= take;
    }
    // A negative row larger than all live lots combined would mean the
    // ledger already drifted from a valid state — nothing further to do
    // here; reconciliation is a separate, explicit step.
  }

  const cutoffTime = cutoff.getTime();
  return lots
    .filter((lot) => new Date(lot.created_at).getTime() < cutoffTime)
    .reduce((sum, lot) => sum + lot.remaining, 0);
}
