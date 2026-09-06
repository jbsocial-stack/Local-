// The story of a shopper's relationship with one business — visits and
// points earned there specifically — as opposed to the wallet page's
// town-wide transaction list. Redemptions aren't tied to where the points
// were earned (any merchant in the scheme accepts them), so only `earn`
// rows count as a "visit" here.
export interface VenueLedgerRow {
  type: string;
  points: number;
  created_at: string;
}

export interface VenueRelationship {
  visits: number;
  pointsEarned: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
}

export function computeVenueRelationship(rows: VenueLedgerRow[]): VenueRelationship {
  const earns = rows.filter((r) => r.type === 'earn');
  if (earns.length === 0) {
    return { visits: 0, pointsEarned: 0, firstVisitAt: null, lastVisitAt: null };
  }
  const sorted = [...earns].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    visits: earns.length,
    pointsEarned: earns.reduce((sum, r) => sum + r.points, 0),
    firstVisitAt: sorted[0]!.created_at,
    lastVisitAt: sorted[sorted.length - 1]!.created_at,
  };
}
