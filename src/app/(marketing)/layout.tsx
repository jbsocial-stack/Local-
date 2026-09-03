import type { Metadata } from 'next';
import { Analytics } from '@/components/marketing/Analytics';
import { Header } from '@/components/marketing/Header';

// H8: default metadata for every marketing route; town pages override
// title/description in their own generateMetadata (see [town]/page.tsx).
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Local — Eat. Shop. Earn.',
  description: 'All the independent shops in your town rolled into one loyalty programme.',
  openGraph: {
    title: 'Local — Eat. Shop. Earn.',
    description: 'All the independent shops in your town rolled into one loyalty programme.',
    images: ['/og'],
  },
};

// Fonts (Outfit/Inter) and brand.css are loaded once, app-wide, in the
// root layout — the whole app shares one typographic system now, not just
// the marketing route group.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics />
      <Header />
      {children}
    </>
  );
}
