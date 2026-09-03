'use client';

import { useState } from 'react';

export function IssuePassButtons({ townSlug }: { townSlug: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function issue(platform: 'apple' | 'google') {
    setStatus('working');
    setError(null);
    const res = await fetch('/api/pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ townSlug, platform }),
    });

    if (platform === 'apple') {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Could not create your pass');
        setStatus('error');
        return;
      }
      const blob = await res.blob();
      window.location.href = URL.createObjectURL(blob);
      return;
    }

    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Could not create your pass');
      setStatus('error');
      return;
    }
    window.location.href = body.saveUrl;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
      <button onClick={() => issue('apple')} disabled={status === 'working'} className="rounded-full bg-black text-white py-3">
        Add to Apple Wallet
      </button>
      <button onClick={() => issue('google')} disabled={status === 'working'} className="rounded-full bg-coral text-white py-3">
        Add to Google Wallet
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
