import type { Metadata } from 'next';
import { findTown, townSlugs } from '../../../../config/towns';
import { HomePageContent } from '@/components/marketing/HomePageContent';

export const revalidate = 300;

// H8: "generate from config" — pre-render the towns we're actively
// promoting; any other slug still renders (falls through to the generic
// homepage below) rather than 404ing, so a vanity/UTM link never dead-ends.
export function generateStaticParams() {
  return townSlugs().map((town) => ({ town }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town: slug } = await params;
  const town = findTown(slug);
  if (!town) return {};
  const title = `Regulars ${town.name} — Eat. Shop. Earn.`;
  const description = `All the independent shops in ${town.name} rolled into one loyalty programme.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [`/og?town=${town.slug}`] },
  };
}

export default async function TownMarketingPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  return <HomePageContent town={findTown(slug)} />;
}
