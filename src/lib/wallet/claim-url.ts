/** R8/R9: the URL baked into every wallet pass's back field. */
export function buildClaimUrl(origin: string, townSlug: string, passId: string): string {
  return `${origin}/${townSlug}/claim?passId=${passId}`;
}
