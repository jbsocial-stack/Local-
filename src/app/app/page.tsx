import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { createServiceClient } from '@/lib/supabase/server';

// Town-agnostic post-sign-in landing spot: figures out which town's wallet
// this shopper belongs to (their most recent unrevoked pass) and forwards
// them there. A signed-in visitor with no pass anywhere just gets sent back
// to sign up.
export default async function AppResolverPage() {
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const service = createServiceClient();
  const { data: pass } = await service
    .from('passes')
    .select('town_id, towns(slug)')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const townSlug = (pass?.towns as unknown as { slug: string } | null)?.slug;
  if (townSlug) redirect(`/${townSlug}/app/wallet`);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="font-medium">We couldn&apos;t find a Regulars pass for this account.</p>
      <Link href="/" className="mt-3 rounded-full bg-coral px-6 py-3 font-medium text-cream">
        Sign up for Regulars
      </Link>
    </main>
  );
}
