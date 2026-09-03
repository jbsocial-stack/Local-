import { createServiceClient } from '../supabase/server';
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
}

/** Shared by the public directory (R8) and the signed-in Discover tab. */
export async function getShopListings(townSlug: string): Promise<{ townId: string; townName: string; listings: ShopListing[] } | null> {
  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('id, name').eq('slug', townSlug).maybeSingle();
  if (!town) return null;

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
          .select('merchant_id, multiplier, starts_at, ends_at')
          .in('merchant_id', merchantIds)
      : { data: [] };

  const now = new Date();
  const listings: ShopListing[] = (merchants ?? []).map((m) => {
    const merchantBoosts = (boosts ?? []).filter((b) => b.merchant_id === m.id);
    const activeMultiplier = resolveActiveMultiplier(m.base_multiplier, merchantBoosts, now);
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
      boosted: activeMultiplier > m.base_multiplier,
    };
  });

  return { townId: town.id, townName: town.name, listings };
}
