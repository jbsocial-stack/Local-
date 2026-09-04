import type { Metadata } from 'next';
import { BusinessPageContent } from '@/components/marketing/BusinessPageContent';

export const metadata: Metadata = {
  title: 'For independent shops — Local',
  description: 'One shared loyalty scheme for your whole high street. Set your own earn rate, 1x–5x.',
};

export default function BusinessPage() {
  return <BusinessPageContent />;
}
