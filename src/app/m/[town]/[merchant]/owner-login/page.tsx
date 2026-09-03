'use client';

import { useParams } from 'next/navigation';
import { MagicLinkForm } from '@/components/MagicLinkForm';

// R6: "merchant receives magic link" — the owner's settings/dashboard
// identity, separate from the PIN till-device session used for scanning.
export default function OwnerLoginPage() {
  const params = useParams<{ town: string; merchant: string }>();
  const redirectTo =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/auth/callback?next=/m/${params.town}/${params.merchant}/dashboard`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      <MagicLinkForm
        title="Owner sign-in"
        subtitle="For settings and your dashboard — staff use the PIN pad on the till."
        redirectTo={redirectTo}
      />
    </main>
  );
}
