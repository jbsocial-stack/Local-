import { notFound, redirect } from 'next/navigation';
import { requireShopper } from '@/lib/auth/require-shopper';
import { getShopListings } from '@/lib/directory/get-listings';
import { NoPassMessage } from '@/components/shopper/NoPassMessage';
import { DiscoverDirectory } from '@/components/shopper/DiscoverDirectory';

export default async function DiscoverPage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const auth = await requireShopper(town);
  if (!auth.ok) {
    if (auth.reason === 'not_signed_in') redirect(`/${town}/app/sign-in`);
    return <NoPassMessage town={town} />;
  }

  const result = await getShopListings(town);
  if (!result) notFound();

  return <DiscoverDirectory town={town} listings={result.listings} />;
}
