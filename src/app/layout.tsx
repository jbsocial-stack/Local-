import type { Metadata, Viewport } from 'next';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import './globals.css';
import { ServiceWorkerRegister } from './sw-register';

export const metadata: Metadata = {
  title: 'Local — Eat. Shop. Earn.',
  description: 'All the independent shops in your town rolled into one loyalty programme.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#F76C5E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display min-h-screen">
        {children}
        <ServiceWorkerRegister />
        <VercelAnalytics />
      </body>
    </html>
  );
}
