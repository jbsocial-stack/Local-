'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

// Password-reset entry point: sends a recovery link via Supabase Auth. The
// link carries a `code` back to /auth/callback?next=/reset-password/confirm
// — the same generic exchange-and-redirect route already used for claim,
// owner, and ops sign-in — which lands the shopper on the confirm page
// with an active session ready to set a new password.
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createBrowserSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password/confirm`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setStatus(error ? 'error' : 'sent');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-center">
        {status === 'sent' ? (
          <>
            <p className="font-display text-lg text-ink">Check your email</p>
            <p className="mt-1 text-sm text-ink/60">
              We sent a password reset link to {email}. Open it to choose a new password.
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 className="font-display text-xl text-ink">Reset your password</h1>
            <p className="mt-1 text-sm text-ink/60">
              We&apos;ll email you a link to choose a new one.
            </p>
            <label className="mt-4 block text-left text-sm font-medium">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-3"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-4 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Email me a reset link'}
            </button>
            {status === 'error' && (
              <p className="mt-2 text-sm text-red-600">Something went wrong — try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
