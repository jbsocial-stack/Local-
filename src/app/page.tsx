import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';

// v1 is single-town (PRD non-goals: "multi-town is data-model only, not UI"),
// so the bare root just forwards to the pilot town's landing page — someone
// typing the bare domain (a letterbox flyer, a bookmark) should never 404.
export default async function RootPage() {
  const supabase = createServiceClient();
  const { data: town } = await supabase
    .from('towns')
    .select('slug')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (town) {
    redirect(`/${town.slug}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-coral">Local</h1>
        <p className="mt-2 text-sm text-neutral-600">No town has been set up yet.</p>
      </div>
    </main>
  );
}
