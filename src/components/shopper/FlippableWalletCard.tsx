'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPence } from '@/lib/ledger/points';

// Tap the card to flip it over and reveal a rotating QR code — the same
// payload format a real Apple/Google Wallet pass's barcode would show
// (encodeQrPayload/generateToken), so /api/scan/verify needs no changes.
// This is what makes scanning work at all before Apple/Google Wallet
// credentials are configured (a known blocker, see README) — sign-up,
// balance, and earning/redeeming were never gated on that, only the
// optional "add to a wallet app" button was.
const REFRESH_MS = 45_000; // comfortably inside the token's 5-minute tolerance

export function FlippableWalletCard({
  balancePoints,
  townName,
  townSlug,
}: {
  balancePoints: number;
  townName: string;
  townSlug: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchQr() {
    const res = await fetch(`/api/pass/qr?town=${encodeURIComponent(townSlug)}`);
    if (!res.ok) {
      setError('Could not load your code — try again.');
      return;
    }
    const body = await res.json();
    setQrDataUrl(body.qrDataUrl);
    setError(null);
  }

  useEffect(() => {
    if (!flipped) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    fetchQr();
    intervalRef.current = setInterval(fetchQr, REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show my balance' : 'Show my QR code'}
        className="block w-full text-left [perspective:1200px]"
      >
        <div
          className="relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div
            className="absolute inset-0 rounded-[28px] bg-paper p-7 text-ink [backface-visibility:hidden]"
            style={{ boxShadow: '0 8px 24px rgba(28,43,68,.18)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="h-9 w-12 rounded-lg bg-coral" aria-hidden />
              <span className="rounded-full bg-line px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                {townName}
              </span>
            </div>
            <p className="mt-5 font-display text-4xl leading-none">{formatPence(balancePoints)}</p>
            <p className="mt-2 text-sm text-ink-muted">{balancePoints} points · ready to spend</p>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-sm font-medium text-ink-muted">Tap to show your QR code</span>
              <span className="font-logo uppercase text-lg text-coral">Regulars</span>
            </div>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[28px] bg-paper p-6 text-ink [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ boxShadow: '0 8px 24px rgba(28,43,68,.18)' }}
          >
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Your Regulars pass QR code" className="h-40 w-40 rounded-xl bg-white p-2" />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-xl bg-line" />
            )}
            <p className="text-sm font-medium">Show this to the till</p>
            <p className="text-xs text-ink-muted">Refreshes automatically · tap to flip back</p>
            {error && <p className="text-xs text-error">{error}</p>}
          </div>
        </div>
      </button>
    </div>
  );
}
