'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { ClaimPasswordForm } from '@/components/shopper/ClaimPasswordForm';

// R9: "claim my account with an email later, so I can recover my points if
// I lose my phone." Reached from the pass back field or the directory page.
export default function ClaimPage() {
  const params = useParams<{ town: string }>();
  const searchParams = useSearchParams();
  const passId = searchParams.get('passId');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passId) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    const supabase = createBrowserSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback?passId=${passId}&next=/claim/complete`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setStatus(error ? 'error' : 'sent');
  }

  if (!passId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4 text-center">
        <p className="max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-red-700">
          Open this page from your Local pass (tap the back of the pass) to claim your account.
        </p>
      </main>
    );
  }

  if (status === 'sent') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4 text-center">
        <div className="max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10">
          <p className="font-display text-lg text-ink">Check your email</p>
          <p className="mt-1 text-sm text-ink/60">We sent a link to {email} to finish claiming your pass.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-center">
        <h1 className="font-display text-xl text-ink">Claim your {params.town} pass</h1>
        <p className="mt-1 text-sm text-ink/60">
          Add an email (and a password, if you&apos;d rather not deal with email links) so you can
          recover your points if you lose your phone.
        </p>

        <ClaimPasswordForm town={params.town} passId={passId} />

        <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-ink/10" />
          or
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={submit}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-ink/15 bg-white px-4 py-3"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-3 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Email me a link'}
          </button>
          {status === 'error' && <p className="mt-2 text-sm text-red-600">Could not send the link — try again.</p>}
        </form>
      </div>
    </main>
  );
}
