'use client';

import { useState } from 'react';
import type { Database } from '@/lib/supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'];

export function MerchantsPanel({ townId, merchants: initialMerchants }: { townId: string; merchants: Merchant[] }) {
  const [merchants, setMerchants] = useState(initialMerchants);

  async function setStatus(id: string, status: 'live' | 'paused') {
    const res = await fetch(`/api/ops/merchants/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const body = await res.json();
      setMerchants((ms) => ms.map((m) => (m.id === id ? body.merchant : m)));
    }
  }

  return (
    <div className="rounded-[28px] bg-paper p-6">
      <h2 className="font-h3 text-lg">Merchants</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {merchants.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-xl bg-line/40 px-3 py-2">
            <span>
              {m.name} — <span className="capitalize">{m.status}</span>
            </span>
            <span className="flex gap-2">
              {m.status !== 'live' && (
                <button onClick={() => setStatus(m.id, 'live')} className="text-success">
                  Approve
                </button>
              )}
              {m.status === 'live' && (
                <button onClick={() => setStatus(m.id, 'paused')} className="text-error">
                  Pause
                </button>
              )}
            </span>
          </li>
        ))}
        {merchants.length === 0 && <li className="text-ink-muted">No merchants yet.</li>}
      </ul>

      <CreateMerchantForm townId={townId} onCreated={(m) => setMerchants((ms) => [...ms, m])} />
    </div>
  );
}

function CreateMerchantForm({ townId, onCreated }: { townId: string; onCreated: (m: Merchant) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/ops/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ townId, name, slug, category, address, ownerName, ownerEmail }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? 'Could not create merchant');
      return;
    }
    const body = await res.json();
    onCreated(body.merchant);
    setName('');
    setSlug('');
    setCategory('');
    setAddress('');
    setOwnerName('');
    setOwnerEmail('');
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2 text-sm">
      <p className="font-medium">Add a merchant</p>
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" required className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" required className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none" />
        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" required className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none" />
        <input
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="Owner email"
          required
          className="h-10 rounded-xl border border-line bg-cream px-3 focus:border-2 focus:border-ink focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="flex h-9 items-center rounded-full bg-coral px-4 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-40"
      >
        Add merchant
      </button>
      {error && <p className="text-error">{error}</p>}
    </form>
  );
}
