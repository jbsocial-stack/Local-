'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// R7: staff sign in with a 4-digit PIN only, no email/password.
export default function StaffLoginPage() {
  const params = useParams<{ town: string; merchant: string }>();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitPin(nextPin: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          townSlug: params.town,
          merchantSlug: params.merchant,
          pin: nextPin,
        }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Incorrect PIN' : 'Could not sign in — try again');
        setPin('');
        return;
      }
      router.push(`/m/${params.town}/${params.merchant}/scan`);
    } finally {
      setSubmitting(false);
    }
  }

  function press(digit: string) {
    if (submitting) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) submitPin(next);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cream px-6">
      <div className="text-center">
        <p className="font-logo uppercase text-lg text-ink">Regulars</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Staff sign in</h1>
        <p className="mt-1 text-sm text-ink/60">Enter your 4-digit PIN</p>
      </div>

      <div className="flex gap-3" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-coral ${
              i < pin.length ? 'bg-coral' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) =>
          key === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={submitting}
              onClick={() => (key === '⌫' ? setPin((p) => p.slice(0, -1)) : press(key))}
              className="h-16 w-16 rounded-full bg-white text-xl font-semibold shadow disabled:opacity-50"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </main>
  );
}
