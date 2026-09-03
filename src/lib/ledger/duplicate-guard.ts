// R3: same pass + same merchant within 2 minutes prompts a confirm-again step
// instead of silently awarding twice.
export const DUPLICATE_WINDOW_SECONDS = 120;

export interface RecentEarn {
  merchant_id: string | null;
  created_at: string;
}

export function isLikelyDuplicateEarn(
  recent: RecentEarn[],
  merchantId: string,
  now: Date = new Date(),
): boolean {
  return recent.some((row) => {
    if (row.merchant_id !== merchantId) return false;
    const ageSeconds = (now.getTime() - new Date(row.created_at).getTime()) / 1000;
    return ageSeconds >= 0 && ageSeconds < DUPLICATE_WINDOW_SECONDS;
  });
}
