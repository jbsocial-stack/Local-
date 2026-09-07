import type { Metadata } from 'next';
import { BusinessPageContent } from '@/components/marketing/BusinessPageContent';

export const metadata: Metadata = {
  title: 'For independent shops — Regulars',
  description: 'One shared loyalty scheme for your whole high street. Set your own earn rate, 1x–5x.',
};

// Same reasoning as the homepage's revalidate (see (marketing)/page.tsx):
// this page now fetches the live shopper-count KPI, which would otherwise
// get baked in at build time and never update.
export const revalidate = 300;

export default function BusinessPage() {
  return <BusinessPageContent />;
}
