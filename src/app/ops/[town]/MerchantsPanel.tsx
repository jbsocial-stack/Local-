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
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="font-semibold">Merchants</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {merchants.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded border px-3 py-2">
            <span>
              {m.name} — <span className="capitalize">{m.status}</span>
            </span>
            <span className="flex gap-2">
              {m.status !== 'live' && (
                <button onClick={() => setStatus(m.id, 'live')} className="text-green-700">
                  Approve
                </button>
              )}
              {m.status === 'live' && (
                <button onClick={() => setStatus(m.id, 'paused')} className="text-red-600">
                  Pause
                </button>
              )}
            </span>
          </li>
        ))}
        {merchants.length === 0 && <li className="text-neutral-500">No merchants yet.</li>}
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
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="rounded border px-2 py-1" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" required className="rounded border px-2 py-1" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required className="rounded border px-2 py-1" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" required className="rounded border px-2 py-1" />
        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" required className="rounded border px-2 py-1" />
        <input
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="Owner email"
          required
          className="rounded border px-2 py-1"
        />
      </div>
      <button type="submit" disabled={submitting} className="rounded-full bg-coral text-white px-4 py-1.5">
        Add merchant
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
