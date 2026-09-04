'use client';

import { PasswordSignInForm } from '@/components/shopper/PasswordSignInForm';

// Town-agnostic entry point, linked from the marketing header. Password-only
// — an account gets its password when the pass is claimed (see
// /[town]/claim). Lands on /app, which looks up which town's pass this
// email owns and forwards to that town's wallet.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-ink/10 bg-white/60 px-6 py-10">
        <PasswordSignInForm title="Sign in to Local" subtitle="Use the password you set." redirectTo="/app" />
      </div>
    </main>
  );
}
