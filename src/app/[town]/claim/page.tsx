'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ClaimPasswordForm } from '@/components/shopper/ClaimPasswordForm';

// R9: "claim my account with a password later, so I can recover my points
// if I lose my phone." Reached from the pass back field or the directory
// page.
export default function ClaimPage() {
  const params = useParams<{ town: string }>();
  const searchParams = useSearchParams();
  const passId = searchParams.get('passId');

  if (!passId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4 text-center">
        <p className="max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-red-700">
          Open this page from your Local pass (tap the back of the pass) to claim your account.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-center">
        <h1 className="font-display text-xl text-ink">Claim your {params.town} pass</h1>
        <p className="mt-1 text-sm text-ink/60">
          Set a password so you can recover your points if you lose your phone.
        </p>

        <ClaimPasswordForm town={params.town} passId={passId} />
      </div>
    </main>
  );
}
