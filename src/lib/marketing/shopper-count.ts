import { createServiceClient } from '../supabase/server';
import { TOWNS } from '../../../config/towns';

export interface TownShopperCount {
  townSlug: string;
  townName: string;
  count: number;
}

export interface ShopperCounts {
  total: number;
  byTown: TownShopperCount[];
}

/**
 * The number that matters most to a prospective merchant: how many
 * shoppers are already carrying a Regulars pass, right now. Counts
 * non-revoked `passes` per town that's actually gone live — config status
 * `live` AND a real `towns` row, same distinction /api/signup's capacity
 * check makes (a town can be `live` in config before ops has onboarded it
 * in the database).
 */
export async function getShopperCounts(): Promise<ShopperCounts> {
  const liveSlugs = TOWNS.filter((t) => t.status === 'live').map((t) => t.slug);
  if (liveSlugs.length === 0) return { total: 0, byTown: [] };

  const supabase = createServiceClient();
  const { data: towns } = await supabase.from('towns').select('id, slug, name').in('slug', liveSlugs);
  if (!towns || towns.length === 0) return { total: 0, byTown: [] };

  const byTown = await Promise.all(
    towns.map(async (town): Promise<TownShopperCount> => {
      const { count } = await supabase
        .from('passes')
        .select('id', { count: 'exact', head: true })
        .eq('town_id', town.id)
        .is('revoked_at', null);
      return { townSlug: town.slug, townName: town.name, count: count ?? 0 };
    }),
  );

  return { total: byTown.reduce((sum, t) => sum + t.count, 0), byTown };
}

/**
 * A count of zero (no towns live yet, or ops hasn't onboarded one) would
 * undercut the pitch if shown as-is — this is the one place that decides
 * what a merchant sees instead.
 */
export function formatTractionHeadline(counts: ShopperCounts): string {
  if (counts.total === 0) {
    return 'Be one of the first shops when Regulars launches — only 500 passes go out per town at the start.';
  }
  if (counts.byTown.length === 1) {
    const town = counts.byTown[0]!;
    return `${town.count} ${town.count === 1 ? 'shopper is' : 'shoppers are'} already earning points in ${town.townName}.`;
  }
  return `${counts.total} shoppers are already earning points across Regulars towns.`;
}
