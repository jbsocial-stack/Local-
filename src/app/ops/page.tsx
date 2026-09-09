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
          <Link href="/ops/signups" className="flex-1 rounded-2xl bg-paper p-4">
            <p className="font-h3">Shopper waitlist</p>
            <p className="mt-0.5 text-sm text-ink-muted">Everyone who&apos;s signed up to hear when their town goes live.</p>
          </Link>
          <Link href="/ops/leads" className="flex-1 rounded-2xl bg-paper p-4">
            <p className="font-h3">Business leads</p>
            <p className="mt-0.5 text-sm text-ink-muted">Founding businesses who&apos;ve requested a trial.</p>
          </Link>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">Towns</h2>
        <ul className="mt-3 space-y-2">
          {(towns ?? []).map((t) => (
            <li key={t.id}>
              <Link href={`/ops/${t.slug}`} className="block rounded-2xl bg-paper p-4 font-medium text-ink">
                {t.name}
              </Link>
            </li>
          ))}
          {(towns ?? []).length === 0 && <li className="text-ink-muted">No towns yet.</li>}
        </ul>

        <div className="mt-8">
          <CreateTownForm />
        </div>
      </div>
    </main>
  );
}
