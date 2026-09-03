// R10: merchant dashboard cards, computed as a pure function over raw
// ledger rows so the arithmetic is unit-testable independent of Supabase.
export interface DashboardLedgerRow {
  type: string;
  points: number;
  pass_id: string;
  created_at: string;
}

export interface DashboardStats {
  visits7d: number;
  visits30d: number;
  uniqueCustomers30d: number;
  repeatCustomers30d: number;
  pointsIssued: number;
  pointsRedeemed: number;
  netPositionPence: number;
}

export function calculateDashboardStats(
  rows: DashboardLedgerRow[],
  pointValuePence: number,
  now: Date = new Date(),
): DashboardStats {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const earns = rows.filter((r) => r.type === 'earn');
  const redeems = rows.filter((r) => r.type === 'redeem');

  const earns30d = earns.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
  const visitsByPass30d = new Map<string, number>();
  for (const row of earns30d) {
    visitsByPass30d.set(row.pass_id, (visitsByPass30d.get(row.pass_id) ?? 0) + 1);
  }

  const pointsIssued = earns.reduce((sum, r) => sum + r.points, 0);
  const pointsRedeemed = redeems.reduce((sum, r) => sum + Math.abs(r.points), 0);

  // AC: net position equals the ledger sum for this merchant — earn rows
  // are stored positive and redeem rows negative, so a plain sum over
  // every merchant-attributed row (not just earn/redeem) is exactly that.
  const netPositionPoints = rows.reduce((sum, r) => sum + r.points, 0);

  return {
    visits7d: earns.filter((r) => new Date(r.created_at) >= sevenDaysAgo).length,
    visits30d: earns30d.length,
    uniqueCustomers30d: visitsByPass30d.size,
    repeatCustomers30d: [...visitsByPass30d.values()].filter((count) => count >= 2).length,
    pointsIssued,
    pointsRedeemed,
    netPositionPence: netPositionPoints * pointValuePence,
  };
}
