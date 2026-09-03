import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveActiveMultiplier } from '@/lib/ledger/multiplier';
import { ShopsDirectory, type ShopListing } from './ShopsDirectory';

// R8: directory + map, public, works logged out.
export default async function ShopsPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: townSlug } = await params;
  const supabase = createServiceClient();

  const { data: town } = await supabase.from('towns').select('id, name').eq('slug', townSlug).maybeSingle();
  if (!town) notFound();

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

  return <ShopsDirectory townName={town.name} listings={listings} />;
}
