'use client';

import { MagicLinkForm } from '@/components/MagicLinkForm';

export default function OpsLoginPage() {
  const redirectTo =
    typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback?next=/ops`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      <MagicLinkForm title="Ops sign-in" redirectTo={redirectTo} />
    </main>
  );
}
