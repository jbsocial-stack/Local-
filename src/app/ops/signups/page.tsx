import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOps } from '@/lib/auth/require-ops';
import { createServiceClient } from '@/lib/supabase/server';

// Global, not per-town: a signup can be for a town that has no `towns` row
// yet (config says planned/coming-soon, ops hasn't onboarded it) — same
// reasoning /api/demand already relies on for the pre-launch numbers.
export default async function OpsSignupsPage() {
  const auth = await requireOps();
  if (!auth.ok) redirect('/ops/login');

  const supabase = createServiceClient();
  const { data: signups } = await supabase
    .from('signups')
    .select('id, email, town_slug, town_free_text, ref_code, consent_marketing, source, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  const rows = signups ?? [];
  const byTown = new Map<string, number>();
  for (const s of rows) {
    const key = s.town_slug ?? s.town_free_text ?? 'unspecified';
    byTown.set(key, (byTown.get(key) ?? 0) + 1);
  }
  const townCounts = [...byTown.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/ops" className="text-sm text-ink/60">
          ← Ops console
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">Shopper waitlist</h1>
          <Link
            href="/api/ops/signups/export"
            prefetch={false}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-sm text-ink"
          >
            Export CSV
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink/60">{rows.length} signups.</p>

        {townCounts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {townCounts.map(([town, count]) => (
              <span key={town} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink shadow">
                {town} · {count}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-ink/50">
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Town</th>
                <th className="px-4 py-2">Referred</th>
                <th className="px-4 py-2">Marketing OK</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">{s.town_slug ?? s.town_free_text ?? '—'}</td>
                  <td className="px-4 py-2">{s.ref_code ? 'Yes' : '—'}</td>
                  <td className="px-4 py-2">{s.consent_marketing ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">{s.source ?? '—'}</td>
                  <td className="px-4 py-2">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    No signups yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
