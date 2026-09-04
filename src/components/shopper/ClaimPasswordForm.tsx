'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

// R9: claim the pass with a password — no email round-trip, unless the
// Supabase project still has "Confirm email" turned on, in which case
// signUp won't return a session and we fall back to asking them to confirm
// once.
export function ClaimPasswordForm({ town, passId }: { town: string; passId: string }) {
  const [mode, setMode] = useState<'create' | 'signin'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'check-email'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function finishClaim() {
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId }),
    });
    if (!res.ok) {
      setStatus('error');
      setErrorMsg("Signed in, but couldn't link your pass — try again.");
      return;
    }
    window.location.href = `/${town}/app/wallet`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    const supabase = createBrowserSupabaseClient();

    if (mode === 'create') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setMode('signin');
          setStatus('error');
          setErrorMsg('You already have an account with this email — enter your password to sign in.');
          return;
        }
        setStatus('error');
        setErrorMsg(error.message);
        return;
      }
      if (!data.session) {
        setStatus('check-email');
        return;
      }
      await finishClaim();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setErrorMsg('Incorrect email or password.');
      return;
    }
    await finishClaim();
  }

  if (status === 'check-email') {
    return (
      <p className="mt-4 text-sm text-neutral-600">
        Check your email to confirm your address, then come back and sign in with your password.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 text-left">
      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
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
        disabled={status === 'submitting'}
        className="w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
      >
        {status === 'submitting' ? 'Please wait…' : mode === 'create' ? 'Create password & claim pass' : 'Sign in & claim pass'}
      </button>
      {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
      <button
        type="button"
        onClick={() => setMode(mode === 'create' ? 'signin' : 'create')}
        className="text-xs underline text-ink/60"
      >
        {mode === 'create' ? 'Already have a password? Sign in instead' : 'New here? Create a password instead'}
      </button>
    </form>
  );
}
