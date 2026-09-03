import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import '../../../styles/brand.css';
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

// H10: self-hosted fonts (next/font downloads and serves them from our own
// origin, not Google's) with font-display: swap, the default here.
const outfit = Outfit({ subsets: ['latin'], weight: ['800'], variable: '--font-outfit' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' });

// Scoped to the marketing route group only — product pages keep their own
// look. CSS custom properties cascade to every descendant, so this just
// overrides --font-display/--font-body (already Tailwind-mapped in
// tailwind.config.ts) for everything under app/(marketing)/.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${outfit.variable} ${inter.variable} font-body`}
      style={
        {
          '--font-display': 'var(--font-outfit)',
          '--font-body': 'var(--font-inter)',
        } as React.CSSProperties
      }
    >
      <Analytics />
      <Header />
      {children}
    </div>
  );
}
