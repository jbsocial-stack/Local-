'use client';

import { MagicLinkForm } from '@/components/MagicLinkForm';
import { PasswordSignInForm } from '@/components/shopper/PasswordSignInForm';

// Town-agnostic entry point, linked from the marketing header. Password is
// the primary path (no email round-trip); the magic link below is the
// fallback for anyone who hasn't set a password yet. Either way the landing
// spot is /app, which looks up which town's pass this email owns and
// forwards to that town's wallet.
export default function SignInPage() {
  const redirectTo =
    typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback?next=/app`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 py-12">
      <PasswordSignInForm title="Sign in to Local" subtitle="Use the password you set." redirectTo="/app" />
      <div className="flex w-full max-w-sm items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        or
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <MagicLinkForm
        title="No password yet?"
        subtitle="We'll email you a sign-in link instead."
        redirectTo={redirectTo}
      />
    </main>
  );
}
