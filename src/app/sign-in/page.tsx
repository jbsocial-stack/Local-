'use client';

import { MagicLinkForm } from '@/components/MagicLinkForm';

// Town-agnostic entry point, linked from the marketing header. The callback
// lands on /app, which looks up which town's pass this email owns and
// forwards to that town's wallet.
export default function SignInPage() {
  const redirectTo =
    typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback?next=/app`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <MagicLinkForm
        title="Sign in to Local"
        subtitle="Use the email you claimed your pass with."
        redirectTo={redirectTo}
      />
    </main>
  );
}
