'use client';

import { useState } from 'react';
import { HeartIcon } from './icons';

export function LikeButton({
  merchantId,
  initialLiked,
  initialCount,
}: {
  merchantId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/merchants/${merchantId}/like`, { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      setLiked(body.liked);
      setCount(body.count);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium ${
        liked ? 'border-coral bg-coral text-cream' : 'border-ink/20 text-ink/70'
      }`}
    >
      <HeartIcon className="h-4 w-4" filled={liked} />
      {count}
    </button>
  );
}
