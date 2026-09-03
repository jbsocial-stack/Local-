'use client';

import { useState } from 'react';

export function ReissueButtons({ town }: { town: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function reissue(platform: 'apple' | 'google') {
    setStatus('working');
    setError(null);
    const res = await fetch('/api/pass/reissue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ townSlug: town, platform }),
    });

    if (platform === 'apple') {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Could not create your pass');
        setStatus('error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.location.href = url;
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
    <div className="text-center">
      <h1 className="text-xl font-bold text-coral">Add your pass to this phone</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Your balance carries over — the pass on your old phone will stop working.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={() => reissue('apple')}
          disabled={status === 'working'}
          className="rounded-full bg-black text-white py-3"
        >
          Add to Apple Wallet
        </button>
        <button
          onClick={() => reissue('google')}
          disabled={status === 'working'}
          className="rounded-full bg-coral text-white py-3"
        >
          Add to Google Wallet
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
