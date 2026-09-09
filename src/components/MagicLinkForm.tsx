'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export function MagicLinkForm({
  redirectTo,
  title,
  subtitle,
}: {
  redirectTo: string;
  title: string;
  subtitle?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setStatus(error ? 'error' : 'sent');
  }

  if (status === 'sent') {
    return (
      <div className="text-center">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-ink-muted">We sent a sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm text-center">
      <h1 className="font-display text-xl text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4 h-12 w-full rounded-2xl border border-line bg-cream px-4 placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-ink font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
      >
        {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-error">Could not send the link — try again.</p>
      )}
    </form>
  );
}
