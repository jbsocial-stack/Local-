import { redirect } from 'next/navigation';

// "/pricing anchors to S8" — see business/page.tsx for why this redirects
// to a fragment rather than duplicating the section under its own URL.
export default function PricingRedirectPage() {
  redirect('/#pricing');
}
