import { redirect } from 'next/navigation';
import { requireStaffSession, requireFullScope } from '@/lib/auth/require-staff';

// R7 AC: a staff (scanner-scope) session cannot open /m/dashboard or settings.
// Full merchant analytics (R10) is Phase B — this just proves the gate works.
export default async function MerchantDashboardPage() {
  const auth = await requireStaffSession();
  if ('error' in auth) redirect('/m');

  const forbidden = requireFullScope(auth.session);
  if (forbidden) redirect('/m');

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <h1 className="text-xl font-semibold text-coral">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Visit/redemption/net-position cards ship in Phase B (R10).
      </p>
    </main>
  );
}
