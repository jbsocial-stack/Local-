import type { createServiceClient } from '../supabase/server';

export interface WaitlistRow {
  referralCode: string;
  referredByCode: string | null;
  createdAt: string; // ISO 8601 — lexicographically sortable
}

export interface WaitlistStats {
  position: number;
  totalInQueue: number;
  referredCount: number;
}

/**
 * Ranks everyone waiting for the same town by how many people they've
 * referred (most referrals first, ties broken by who signed up first) —
 * referring friends is the only way to move up. Returns null if
 * `myReferralCode` isn't in `rows`.
 */
export function computeWaitlistStats(rows: WaitlistRow[], myReferralCode: string): WaitlistStats | null {
  const referredCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.referredByCode) continue;
    referredCounts.set(row.referredByCode, (referredCounts.get(row.referredByCode) ?? 0) + 1);
  }

  const ranked = [...rows].sort((a, b) => {
    const countA = referredCounts.get(a.referralCode) ?? 0;
    const countB = referredCounts.get(b.referralCode) ?? 0;
    if (countA !== countB) return countB - countA;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const index = ranked.findIndex((r) => r.referralCode === myReferralCode);
  if (index === -1) return null;

  return {
    position: index + 1,
    totalInQueue: ranked.length,
    referredCount: referredCounts.get(myReferralCode) ?? 0,
  };
}

/**
 * Loads everyone waiting for the same town as `townSlug`/`townFreeText`.
 * Someone who picked a town from the dropdown and someone who free-typed
 * the same name are counted as one queue — same "identifier matches
 * either column" semantics the old planned-town vote count used.
 */
export async function fetchTownQueue(
  supabase: ReturnType<typeof createServiceClient>,
  townSlug: string | null,
  townFreeText: string | null,
): Promise<WaitlistRow[]> {
  const identifier = townSlug ?? townFreeText ?? '';
  const [bySlug, byFreeText] = await Promise.all([
    supabase.from('signups').select('referral_code, ref_code, created_at').eq('town_slug', identifier),
    supabase.from('signups').select('referral_code, ref_code, created_at').eq('town_free_text', identifier),
  ]);
  return [...(bySlug.data ?? []), ...(byFreeText.data ?? [])].map((r) => ({
    referralCode: r.referral_code,
    referredByCode: r.ref_code,
    createdAt: r.created_at,
  }));
}
