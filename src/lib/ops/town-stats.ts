// R11/R17 (success metrics): town-level ops dashboard, computed as a pure
// function so the arithmetic behind "how's the pilot doing" is testable
// independent of Supabase.
export interface TownStatsLedgerRow {
  type: string;
  pass_id: string;
  basket_pence: number | null;
  created_at: string;
}

export interface TownStatsInput {
  passesIssued: number;
  merchantsLive: number;
  outstandingBalancePoints: number; // sum of passes.balance_points, town-wide
  ledgerRows: TownStatsLedgerRow[];
}

export interface TownStats {
  passesIssued: number;
  merchantsLive: number;
  activeEarners30d: number;
  gmvProxyPence: number;
  pointsOutstanding: number;
}

export function calculateTownStats(input: TownStatsInput, now: Date = new Date()): TownStats {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const earns = input.ledgerRows.filter((r) => r.type === 'earn');
  const recentEarns = earns.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);

  return {
    passesIssued: input.passesIssued,
    merchantsLive: input.merchantsLive,
    activeEarners30d: new Set(recentEarns.map((r) => r.pass_id)).size,
    // Basket value entered at scan-time, summed across every earn ever —
    // a proxy for GMV since Regulars never processes the actual payment.
    gmvProxyPence: earns.reduce((sum, r) => sum + (r.basket_pence ?? 0), 0),
    pointsOutstanding: input.outstandingBalancePoints,
  };
}
