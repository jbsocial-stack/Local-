import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { BottomNav } from '@/components/shopper/BottomNav';

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
