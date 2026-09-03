import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { IssuePassButtons } from './IssuePassButtons';

// R1: "landing page per town (/chichester) with Add to Apple/Google Wallet."
// No login — this is the whole point of the no-login onboarding flow.
export default async function TownLandingPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: townSlug } = await params;
  const supabase = createServiceClient();
  const { data: town } = await supabase.from('towns').select('name').eq('slug', townSlug).maybeSingle();
  if (!town) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="text-3xl font-bold text-coral">Local {town.name}</h1>
      <p className="mt-2 max-w-sm text-neutral-600">
        Eat. Shop. Earn. One card for every independent shop in {town.name} — free, no account
        needed.
      </p>
      <IssuePassButtons townSlug={townSlug} />
      <a href={`/${townSlug}/shops`} className="mt-6 text-sm text-coral underline">
        See every shop in the scheme
      </a>
    </main>
  );
}
