import { redirect } from 'next/navigation';
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
        <h1 className="text-xl font-bold text-coral">Ops console</h1>

        <ul className="mt-6 space-y-2">
          {(towns ?? []).map((t) => (
            <li key={t.id}>
              <a href={`/ops/${t.slug}`} className="block rounded-xl bg-white p-4 shadow font-medium">
                {t.name}
              </a>
            </li>
          ))}
          {(towns ?? []).length === 0 && <li className="text-neutral-500">No towns yet.</li>}
        </ul>

        <div className="mt-8">
          <CreateTownForm />
        </div>
      </div>
    </main>
  );
}
