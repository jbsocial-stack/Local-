import { HomePageContent } from '@/components/marketing/HomePageContent';

// H6: page-level revalidate so the demand map's aggregate can be cached for
// 5 minutes without Next trying to fully statically prerender this page at
// build time (it reads from Supabase, which isn't available at build time).
export const revalidate = 300;

export default function MarketingHomePage() {
  return <HomePageContent />;
}
