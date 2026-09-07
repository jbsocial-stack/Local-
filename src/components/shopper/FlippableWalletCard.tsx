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
  platform,
}: {
  balancePoints: number;
  townName: string;
  townSlug: string;
  platform: 'apple' | 'google' | null;
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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-ink to-ink/80 p-6 text-cream shadow-lg [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cream/80">Regulars pass</span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-coral">{townName}</span>
            </div>
            <p className="mt-8 font-display text-5xl">
              {formatPence(balancePoints)}
              <span className="ml-2 font-body text-base font-normal text-cream/80">balance</span>
            </p>
            <p className="mt-1 text-sm text-cream/80">{balancePoints} points · ready to spend</p>
            <div className="mt-6 flex items-center gap-3 border-t border-cream/20 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/20 font-logo uppercase text-sm font-semibold">
                R
              </span>
              <span className="text-sm text-cream/80">
                {platform ? `In your ${platform === 'apple' ? 'Apple' : 'Google'} Wallet` : 'Tap to show your QR code'}
              </span>
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-ink p-6 text-cream shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Your Regulars pass QR code" className="h-40 w-40 rounded-xl bg-white p-2" />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-xl bg-cream/10" />
            )}
            <p className="text-sm font-medium">Show this to the till</p>
            <p className="text-xs text-cream/60">Refreshes automatically · tap to flip back</p>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>
        </div>
      </button>
    </div>
  );
}
