import { redirect } from 'next/navigation';

// "/pricing anchors to S8" — see business/page.tsx for why this redirects
// to a fragment rather than duplicating the section under its own URL.
// Pricing moved off the shopper-first homepage onto /business (its tiers
// are business content — the one shopper tier is "Free forever", already
// covered on the shopper page), so this now points there instead of `/`.
export default function PricingRedirectPage() {
  redirect('/business#pricing');
}
