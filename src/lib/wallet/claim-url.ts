/**
 * R8/R9: the URL baked into every wallet pass's back field. Every pass
 * belongs to a real account from the moment it's created (signup creates
 * the account and the pass together), so this just needs to get a shopper
 * on a new device signed back in — there's nothing left to "claim".
 */
export function buildClaimUrl(origin: string, townSlug: string): string {
  return `${origin}/${townSlug}/app/sign-in`;
}
