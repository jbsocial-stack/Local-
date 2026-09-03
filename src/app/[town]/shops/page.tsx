import { notFound } from 'next/navigation';
import { getShopListings } from '@/lib/directory/get-listings';
import { ShopsDirectory } from './ShopsDirectory';

// R8: directory + map, public, works logged out.
export default async function ShopsPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: townSlug } = await params;
  const result = await getShopListings(townSlug);
  if (!result) notFound();

  return <ShopsDirectory townName={result.townName} listings={result.listings} />;
}
