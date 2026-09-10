import { createServiceClient } from '../supabase/server';
import { getTownBySlug } from '../towns/get-town';
import { resolveActiveMultiplier } from '../ledger/multiplier';

export interface ShopListing {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  hours: Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', { open: string; close: string } | null>>;
  photoUrl: string | null;
  activeMultiplier: number;
  boosted: boolean;
  offerLabel: string | null;
}

/** Shared by the public directory (R8) and the signed-in Discover tab. */
export async function getShopListings(townSlug: string): Promise<{ townId: string; townName: string; listings: ShopListing[] } | null> {
  const town = await getTownBySlug(townSlug);
  if (!town) return null;

  const supabase = createServiceClient();

  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, name, slug, category, description, address, lat, lng, hours, photo_url, base_multiplier')
    .eq('town_id', town.id)
    .eq('status', 'live')
    .order('name', { ascending: true });

  const merchantIds = (merchants ?? []).map((m) => m.id);
  const { data: boosts } =
    merchantIds.length > 0
      ? await supabase
          .from('merchant_boosts')
          .select('merchant_id, multiplier, starts_at, ends_at, label')
          .in('merchant_id', merchantIds)
      : { data: [] };

  const now = new Date();
  const listings: ShopListing[] = (merchants ?? []).map((m) => {
    const merchantBoosts = (boosts ?? []).filter((b) => b.merchant_id === m.id);
    const activeMultiplier = resolveActiveMultiplier(m.base_multiplier, merchantBoosts, now);
    const boosted = activeMultiplier > m.base_multiplier;
    const activeBoost = merchantBoosts.find((b) => new Date(b.starts_at) <= now && now < new Date(b.ends_at));
    return {
      id: m.id,
      name: m.name,
      slug: m.slug,
      category: m.category,
      description: m.description,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      hours: (m.hours as ShopListing['hours']) ?? {},
      photoUrl: m.photo_url,
      activeMultiplier,
      boosted,
      offerLabel: boosted ? (activeBoost?.label ?? `${activeMultiplier}x points today`) : null,
    };
  });

  return { townId: town.id, townName: town.name, listings };
}
