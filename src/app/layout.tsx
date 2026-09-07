import type { Metadata, Viewport } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import './globals.css';
import '../../styles/brand.css';
import { ServiceWorkerRegister } from './sw-register';

export const metadata: Metadata = {
  title: 'Regulars — Eat. Shop. Earn.',
  description: 'All the independent shops in your town rolled into one loyalty programme.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#F76C5E',
};

// Same brand fonts as the marketing route group (styles/brand.css maps
// --font-display/--font-body to Tailwind's font-display/font-body), loaded
// here too so the signed-in shopper app and every other product route
// share the same typography instead of falling back to the unloaded
// 'Poppins' default in globals.css.
const outfit = Outfit({ subsets: ['latin'], weight: ['800'], variable: '--font-outfit' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} font-body min-h-screen`}
        style={
          {
            '--font-display': 'var(--font-outfit)',
            '--font-body': 'var(--font-inter)',
          } as React.CSSProperties
        }
      >
        {children}
        <ServiceWorkerRegister />
        <VercelAnalytics />
      </body>
    </html>
  );
}
