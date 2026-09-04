'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

// Password-only shopper sign-in — the password is set at signup
// (/[town]/shoppers, for a live town) or later in profile settings.
// redirectTo is the final destination — signInWithPassword establishes the
// session directly, no /auth/callback round-trip needed.
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
      <h1 className="font-display text-xl text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      <div className="mt-4 space-y-3 text-left">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border border-ink/15 bg-white px-4 py-3"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-3 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
      >
        {status === 'submitting' ? 'Signing in…' : 'Sign in with password'}
      </button>
      <Link href="/reset-password" className="mt-3 inline-block text-sm text-ink/60 underline">
        Forgot password?
      </Link>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Incorrect email or password. New here? <Link href="/shoppers" className="underline">Sign up</Link> instead.
        </p>
      )}
    </form>
  );
}
