import type { LedgerType } from '../supabase/types';

export interface LastLedgerRow {
  type: LedgerType;
  points: number;
  created_at: string;
}

const VERBS: Record<LedgerType, string> = {
  earn: 'Earned',
  redeem: 'Redeemed',
  expire: 'Expired',
  adjust: 'Adjusted',
  reversal: 'Reversed',
  mission: 'Bonus',
};

/** The one-line summary shown on the pass's secondary field (R1). */
export function formatLastActivity(row: LastLedgerRow | null): string {
  if (!row) return 'No activity yet';
  const verb = VERBS[row.type];
  const points = Math.abs(row.points);
  return `${verb} ${points} pt${points === 1 ? '' : 's'}`;
}
