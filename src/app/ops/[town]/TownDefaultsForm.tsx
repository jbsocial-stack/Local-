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
    <form onSubmit={save} className="rounded-[28px] bg-paper p-6 space-y-3">
      <h2 className="font-h3 text-lg">Town defaults</h2>
      <label className="block text-sm">
        Point value (pence per point)
        <input
          type="number"
          min={1}
          value={pointValuePence}
          onChange={(e) => setPointValuePence(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        Base points (per £1 at 1x)
        <input
          type="number"
          min={0}
          value={basePoints}
          onChange={(e) => setBasePoints(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        Expiry (months)
        <input
          type="number"
          min={1}
          value={expiryMonths}
          onChange={(e) => setExpiryMonths(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-2xl border border-line bg-cream px-4 focus:border-2 focus:border-ink focus:outline-none"
        />
      </label>
      <button type="submit" disabled={status === 'saving'} className="flex h-11 items-center rounded-full bg-coral px-6 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-40">
        Save
      </button>
      {status === 'saved' && <span className="ml-3 text-sm text-success">Saved.</span>}
    </form>
  );
}
