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
        <p className="mt-1 text-sm text-neutral-600">We sent a sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm text-center">
      <h1 className="font-display text-xl text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-4 w-full rounded-full border border-ink/15 bg-white px-4 py-3 placeholder:text-ink/40"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-3 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">Could not send the link — try again.</p>
      )}
    </form>
  );
}
