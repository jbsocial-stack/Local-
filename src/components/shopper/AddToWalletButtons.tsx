'use client';

import { useState } from 'react';

// Lives on the signed-in wallet page — adding the pass to a real wallet
// app is optional and separate from having an account (see /api/pass and
// /api/signup). Apple/Google Wallet not being configured on this deploy
// yet (a known blocker, see README) only affects this button, never
// sign-up or sign-in.
export function AddToWalletButtons({ town }: { town: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function add(platform: 'apple' | 'google') {
    setStatus('working');
    setError(null);
    const res = await fetch('/api/pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ townSlug: town, platform }),
    });
    if (platform === 'apple') {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Could not add your pass to Apple Wallet');
        setStatus('error');
        return;
      }
      const blob = await res.blob();
      window.location.href = URL.createObjectURL(blob);
      setStatus('idle');
      return;
    }
    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Could not add your pass to Google Wallet');
      setStatus('error');
      return;
    }
    window.location.href = body.saveUrl;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => add('apple')}
          disabled={status === 'working'}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-black text-sm font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
        >
          Add to Apple Wallet
        </button>
        <button
          onClick={() => add('google')}
          disabled={status === 'working'}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-coral text-sm font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
        >
          Add to Google Wallet
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
