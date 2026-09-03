'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

// Alternative to the magic-link form: for shoppers who've set a password
// (via the claim flow or their profile settings) and don't want to wait on
// an email each time. redirectTo is the final destination, not an
// /auth/callback URL — signInWithPassword establishes the session directly.
export function PasswordSignInForm({
  redirectTo,
  title,
  subtitle,
}: {
  redirectTo: string;
  title: string;
  subtitle?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm text-center">
      <h1 className="text-xl font-bold text-coral">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
      <div className="mt-4 space-y-3 text-left">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-coral px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-coral px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-3 w-full rounded-full bg-coral text-white py-2 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Signing in…' : 'Sign in with password'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Incorrect password — or you haven&apos;t set one yet. Use the email link below, then set a
          password from your profile.
        </p>
      )}
    </form>
  );
}
