import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
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
  themeColor: '#F26B5B',
};

// Body/mono are next/font Google fonts; display (Windsor Pro Ultra Heavy)
// and h3 (Windsor Pro Bold) are local @font-face in globals.css instead,
// since they're not Google-hosted. Loaded once here, app-wide, so the
// signed-in shopper app and every other product route share the same
// typography instead of falling back to the unloaded 'Poppins' default.
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains-mono' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-body min-h-screen`}
        style={
          {
            '--font-display': "'Windsor Pro'",
            '--font-body': 'var(--font-inter)',
            '--font-mono': 'var(--font-jetbrains-mono)',
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
