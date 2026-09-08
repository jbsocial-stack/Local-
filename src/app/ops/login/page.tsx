'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OpsLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/ops/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.status === 503 ? 'Ops sign-in isn’t configured yet' : 'Incorrect password');
      setPassword('');
      return;
    }
    router.push('/ops');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <p className="font-logo uppercase text-lg text-ink">Regulars</p>
        <h1 className="mt-3 font-display text-xl text-ink">Ops sign-in</h1>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-4 w-full rounded-full border border-ink/15 bg-white px-4 py-3 text-center placeholder:text-ink/40"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 w-full rounded-full bg-ink py-3 font-medium text-cream disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
