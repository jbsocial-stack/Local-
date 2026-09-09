'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateTownForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/ops/towns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError('Could not create town — check the slug is unique and lowercase.');
      return;
    }
    router.push(`/ops/${slug}`);
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] bg-paper p-6 space-y-3">
      <h2 className="font-h3 text-lg">Create a town</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Town name"
        required
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug (e.g. chichester)"
        required
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex h-11 items-center rounded-full bg-coral px-6 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-40"
      >
        Create
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
