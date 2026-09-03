'use client';

import { useState } from 'react';
import type { Database } from '@/lib/supabase/types';

type Town = Database['public']['Tables']['towns']['Row'];

export function TownDefaultsForm({ town }: { town: Town }) {
  const [pointValuePence, setPointValuePence] = useState(town.point_value_pence);
  const [basePoints, setBasePoints] = useState(town.base_points);
  const [expiryMonths, setExpiryMonths] = useState(town.expiry_months);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    await fetch(`/api/ops/towns/${town.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointValuePence, basePoints, expiryMonths }),
    });
    setStatus('saved');
  }

  return (
    <form onSubmit={save} className="rounded-xl bg-white p-6 shadow space-y-3">
      <h2 className="font-semibold">Town defaults</h2>
      <label className="block text-sm">
        Point value (pence per point)
        <input
          type="number"
          min={1}
          value={pointValuePence}
          onChange={(e) => setPointValuePence(Number(e.target.value))}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Base points (per £1 at 1x)
        <input
          type="number"
          min={0}
          value={basePoints}
          onChange={(e) => setBasePoints(Number(e.target.value))}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Expiry (months)
        <input
          type="number"
          min={1}
          value={expiryMonths}
          onChange={(e) => setExpiryMonths(Number(e.target.value))}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <button type="submit" disabled={status === 'saving'} className="rounded-full bg-coral text-white px-6 py-2">
        Save
      </button>
      {status === 'saved' && <span className="ml-3 text-sm text-green-700">Saved.</span>}
    </form>
  );
}
