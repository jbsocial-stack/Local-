'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

// Landed on after /auth/callback exchanges the recovery link's code for a
// session. That session is enough to call updateUser({ password }) — no
// separate "recovery token" handling needed, same as any other signed-in
// password change.
export default function ResetPasswordConfirmPage() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    createBrowserSupabaseClient()
      .auth.getUser()
      .then(({ data }) => {
        setHasSession(!!data.user);
        setChecking(false);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    window.location.href = '/app';
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white/60 px-6 py-10 text-center">
        {checking ? null : !hasSession ? (
          <>
            <p className="font-display text-lg text-ink">Link expired</p>
            <p className="mt-1 text-sm text-ink/60">
              This reset link is no longer valid. Request a new one from the sign-in page.
            </p>
            <Link href="/reset-password" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream">
              Request a new link
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 className="font-display text-xl text-ink">Choose a new password</h1>
            <label className="mt-4 block text-left text-sm font-medium">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-3"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="mt-4 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Set new password'}
            </button>
            {status === 'error' && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
