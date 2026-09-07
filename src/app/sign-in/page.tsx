'use client';

import { PasswordSignInForm } from '@/components/shopper/PasswordSignInForm';

// Town-agnostic entry point, linked from the marketing header. Password-only
// — the account and its password are created together at signup
// (/[town]/shoppers, for a live town). Lands on /app, which looks up which
// town's pass this email owns and forwards to that town's wallet.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-ink/10 bg-white/60 px-6 py-10">
        <PasswordSignInForm title="Sign in to Regulars" subtitle="Use the password you set." redirectTo="/app" />
      </div>
    </main>
  );
}
