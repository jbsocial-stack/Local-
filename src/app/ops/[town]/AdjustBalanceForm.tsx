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
    <form onSubmit={submit} className="rounded-[28px] bg-paper p-6 space-y-3">
      <h2 className="font-h3 text-lg">Adjust a balance</h2>
      <input
        value={passId}
        onChange={(e) => setPassId(e.target.value)}
        placeholder="Pass ID"
        required
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 text-sm placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="Points (negative to remove)"
        required
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 text-sm placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        required
        className="h-11 w-full rounded-2xl border border-line bg-cream px-4 text-sm placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
      />
      <button type="submit" disabled={status === 'saving'} className="flex h-11 items-center rounded-full bg-coral px-6 text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-40">
        Adjust
      </button>
      {status === 'done' && <span className="ml-3 text-sm text-success">Applied.</span>}
      {status === 'error' && <span className="ml-3 text-sm text-error">Could not adjust — check the pass ID and balance.</span>}
    </form>
  );
}
