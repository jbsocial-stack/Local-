// R3/R4/R5: server-computed points. The client never sends a points value —
// only a basket or redemption amount in pence — and these are the only
// functions allowed to turn money into points or points into money.

export interface EarnCalcInput {
  basketPence: number;
  basePoints: number; // town.base_points — points per pound at 1x
  multiplier: number; // merchant.base_multiplier, or an active boost's multiplier
  pointValuePence: number; // town.point_value_pence — fixed at 1 for v1
}

export interface EarnCalcResult {
  points: number;
  gbpValuePence: number; // cash value of the points awarded
}

export function calculateEarn({
  basketPence,
  basePoints,
  multiplier,
  pointValuePence,
}: EarnCalcInput): EarnCalcResult {
  if (basketPence < 0) throw new Error('basketPence must be >= 0');
  if (multiplier < 1 || multiplier > 5) throw new Error('multiplier must be between 1 and 5');

  const points = Math.floor((basketPence * basePoints * multiplier) / 100);
  return { points, gbpValuePence: points * pointValuePence };
}

export interface RedeemCalcInput {
  requestedPence: number;
  balancePoints: number;
  pointValuePence: number;
}

export type RedeemCalcResult =
  | { ok: true; points: number; gbpValuePence: number }
  | { ok: false; reason: 'insufficient_balance'; availablePence: number };

export function calculateRedeem({
  requestedPence,
  balancePoints,
  pointValuePence,
}: RedeemCalcInput): RedeemCalcResult {
  if (requestedPence <= 0) throw new Error('requestedPence must be > 0');

  const points = Math.floor(requestedPence / pointValuePence);
  if (points > balancePoints) {
    return {
      ok: false,
      reason: 'insufficient_balance',
      availablePence: balancePoints * pointValuePence,
    };
  }
  return { ok: true, points, gbpValuePence: points * pointValuePence };
}

/** Format pence as a "£x.xx" string for merchant-facing messages. */
export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
