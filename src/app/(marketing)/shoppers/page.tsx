import type { Metadata } from 'next';
import { ShopperPageContent } from '@/components/marketing/ShopperPageContent';

export const metadata: Metadata = {
  title: 'For shoppers — Local',
  description: 'One wallet pass for every independent shop in your town. Free, forever.',
};

export default function ShoppersPage() {
  return <ShopperPageContent />;
}
