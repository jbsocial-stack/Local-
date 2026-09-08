import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOps } from '@/lib/auth/require-ops';
import { createServiceClient } from '@/lib/supabase/server';
import { LeadsPanel } from './LeadsPanel';

export default async function OpsLeadsPage() {
  const auth = await requireOps();
  if (!auth.ok) redirect('/ops/login');

  const supabase = createServiceClient();
  const { data: leads } = await supabase
    .from('merchant_leads')
    .select('id, business_name, contact_name, email, phone, town_slug, venues, category, notes, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/ops" className="text-sm text-ink/60">
          ← Ops console
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">Business leads</h1>
          <Link
            href="/api/ops/leads/export"
            prefetch={false}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-sm text-ink"
          >
            Export CSV
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink/60">{(leads ?? []).length} leads.</p>

        <LeadsPanel leads={leads ?? []} />
      </div>
    </main>
  );
}
