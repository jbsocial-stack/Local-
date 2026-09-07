import type { Metadata } from 'next';
import { findTown, townSlugs } from '../../../../../config/towns';
import { ShopperPageContent } from '@/components/marketing/ShopperPageContent';

export const revalidate = 300;

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
  return {
    title: `For shoppers in ${town.name} — Regulars`,
    description: `Get your Regulars pass for ${town.name} — one wallet pass for every independent shop in town.`,
  };
}

export default async function TownShoppersPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  return <ShopperPageContent town={findTown(slug)} />;
}
