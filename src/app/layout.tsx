import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Local — Eat. Shop. Earn.',
  description: 'All the independent shops in your town rolled into one loyalty programme.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display min-h-screen">{children}</body>
    </html>
  );
}
