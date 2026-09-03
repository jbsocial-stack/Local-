import { createServiceClient } from '../supabase/server';
import type { DemandCount } from './demand-map';

/**
 * Shared by /api/demand (for any client-side refresh) and the homepage's
 * server-rendered DemandMap — a Server Component should call this directly
 * rather than fetching its own API route.
 */
export async function getDemandCounts(): Promise<DemandCount[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.from('signups').select('town_slug').not('town_slug', 'is', null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.town_slug) continue;
    counts.set(row.town_slug, (counts.get(row.town_slug) ?? 0) + 1);
  }
  return [...counts.entries()].map(([townSlug, count]) => ({ townSlug, count }));
}
