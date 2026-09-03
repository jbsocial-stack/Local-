'use client';

import { useState } from 'react';

// R11: "adjust a balance with a reason, so fraud or mistakes can be fixed."
export function AdjustBalanceForm() {
  const [passId, setPassId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const res = await fetch(`/api/ops/passes/${passId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: Number(points), reason }),
    });
    if (!res.ok) {
      setStatus('error');
      return;
    }
    setStatus('done');
    setPoints('');
    setReason('');
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow space-y-3">
      <h2 className="font-semibold">Adjust a balance</h2>
      <input
        value={passId}
        onChange={(e) => setPassId(e.target.value)}
        placeholder="Pass ID"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="Points (negative to remove)"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <button type="submit" disabled={status === 'saving'} className="rounded-full bg-coral text-white px-6 py-2">
        Adjust
      </button>
      {status === 'done' && <span className="ml-3 text-sm text-green-700">Applied.</span>}
      {status === 'error' && <span className="ml-3 text-sm text-red-600">Could not adjust — check the pass ID and balance.</span>}
    </form>
  );
}
