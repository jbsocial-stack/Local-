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
    <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow space-y-3">
      <h2 className="font-semibold">Create a town</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Town name"
        required
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug (e.g. chichester)"
        required
        className="w-full rounded border px-3 py-2"
      />
      <button type="submit" disabled={submitting} className="rounded-full bg-coral text-white px-6 py-2">
        Create
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
