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
          className="mt-4 h-12 w-full rounded-2xl border border-line bg-cream text-center placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-ink font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </form>
    </main>
  );
}
