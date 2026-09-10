import type { Metadata } from 'next';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { BottomNav } from '@/components/shopper/BottomNav';

// "Add to Home Screen" from any page under /<town>/app (wallet, sign-in,
// discover...) should reopen straight back into the wallet, not the
// generic /m landing page the merchant manifest (src/app/layout.tsx)
// points at. Overriding `manifest` here, at the segment covering every
// page in the shopper app, means it doesn't matter which one someone
// actually adds — they all resolve to the same per-town manifest.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town } = await params;
  return {
    manifest: `/${town}/app/manifest.webmanifest`,
  };
}

// "Once signed in, a user should see a main navigation" — the nav itself
// only renders when there's a live Supabase Auth session; individual pages
// (wallet/discover/offers/profile) separately enforce the redirect-to-sign-in
// via requireShopper(), same split as requireOwner/requireOps elsewhere.
export default async function ShopperAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ town: string }>;
}) {
  const { town } = await params;
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className={user ? 'pb-28' : ''}>{children}</div>
      {user && <BottomNav town={town} />}
    </div>
  );
}
