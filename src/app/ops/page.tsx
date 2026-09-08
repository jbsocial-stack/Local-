import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOps } from '@/lib/auth/require-ops';
import { createServiceClient } from '@/lib/supabase/server';
import { CreateTownForm } from './CreateTownForm';

export default async function OpsHomePage() {
  const auth = await requireOps();
  if (!auth.ok) redirect('/ops/login');

  const supabase = createServiceClient();
  const { data: towns } = await supabase.from('towns').select('id, slug, name').order('name');

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-ink">Ops console</h1>

        <div className="mt-4 flex gap-2">
          <Link href="/ops/signups" className="flex-1 rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-ink">Shopper waitlist</p>
            <p className="mt-0.5 text-sm text-ink/60">Everyone who&apos;s signed up to hear when their town goes live.</p>
          </Link>
          <Link href="/ops/leads" className="flex-1 rounded-xl bg-white p-4 shadow">
            <p className="font-semibold text-ink">Business leads</p>
            <p className="mt-0.5 text-sm text-ink/60">Founding businesses who&apos;ve requested a trial.</p>
          </Link>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.1em] text-ink/50">Towns</h2>
        <ul className="mt-3 space-y-2">
          {(towns ?? []).map((t) => (
            <li key={t.id}>
              <Link href={`/ops/${t.slug}`} className="block rounded-xl bg-white p-4 shadow font-medium text-ink">
                {t.name}
              </Link>
            </li>
          ))}
          {(towns ?? []).length === 0 && <li className="text-ink/50">No towns yet.</li>}
        </ul>

        <div className="mt-8">
          <CreateTownForm />
        </div>
      </div>
    </main>
  );
}
