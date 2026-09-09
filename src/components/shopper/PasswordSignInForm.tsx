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
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      <div className="mt-4 space-y-3 text-left">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-12 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-12 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-ink font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {status === 'submitting' ? 'Signing in…' : 'Sign in with password'}
      </button>
      <Link href="/reset-password" className="mt-3 inline-block text-sm text-ink-muted underline">
        Forgot password?
      </Link>
      {status === 'error' && (
        <p className="mt-2 text-sm text-error">
          Incorrect email or password. New here? <Link href="/shoppers" className="underline">Sign up</Link> instead.
        </p>
      )}
    </form>
  );
}
