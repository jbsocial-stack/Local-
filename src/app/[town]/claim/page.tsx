'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

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
      <main className="min-h-screen flex items-center justify-center bg-cream px-6 text-center">
        <p className="text-red-600">
          Open this page from your Local pass (tap the back of the pass) to claim your account.
        </p>
      </main>
    );
  }

  if (status === 'sent') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-6 text-center">
        <div>
          <p className="font-medium">Check your email</p>
          <p className="mt-1 text-sm text-neutral-600">We sent a link to {email} to finish claiming your pass.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-coral">Claim your {params.town} pass</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Add an email so you can recover your points if you lose your phone.
        </p>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded border border-coral px-3 py-2"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-3 w-full rounded-full bg-coral text-white py-2 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Email me a link'}
        </button>
        {status === 'error' && <p className="mt-2 text-sm text-red-600">Could not send the link — try again.</p>}
      </form>
    </main>
  );
}
