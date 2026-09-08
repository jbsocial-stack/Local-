'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

type Stage =
  | { name: 'scanning' }
  | { name: 'error'; message: string }
  | { name: 'customer'; customer: CustomerSummary }
  | { name: 'entering-amount'; customer: CustomerSummary; mode: 'earn' | 'redeem' }
  | { name: 'confirm-duplicate'; customer: CustomerSummary; basketPence: number }
  | { name: 'result'; result: EarnResult | RedeemResult };

interface CustomerSummary {
  passId: string;
  balancePoints: number;
  displayName: string | null;
  visitNumberThisMonth: number;
}

interface EarnResult {
  kind: 'earn';
  points: number;
  multiplier: number;
  balancePoints: number;
}

interface RedeemResult {
  kind: 'redeem';
  points: number;
  gbpValuePence: number;
  balancePoints: number;
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default function ScanPage() {
  const [stage, setStage] = useState<Stage>({ name: 'scanning' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const handlePayload = useCallback(async (payload: string) => {
    controlsRef.current?.stop();
    try {
      const res = await fetch('/api/scan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStage({ name: 'error', message: body.message ?? 'Could not read that pass' });
        return;
      }
      setStage({
        name: 'customer',
        customer: {
          passId: body.passId,
          balancePoints: body.balancePoints,
          displayName: body.displayName,
          visitNumberThisMonth: body.visitNumberThisMonth,
        },
      });
    } catch {
      setStage({ name: 'error', message: 'Network error — try again' });
    }
  }, []);

  useEffect(() => {
    // E2E tests can't feed a real camera a rotating QR code, so this flag
    // (set only in the Playwright webServer config, never in production)
    // swaps the camera for a plain text input wired to the same handler.
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1') return;
    if (stage.name !== 'scanning' || !videoRef.current) return;
    const reader = new BrowserQRCodeReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, _err, controls) => {
        if (controlsRef.current == null) controlsRef.current = controls;
        if (cancelled || !result) return;
        void handlePayload(result.getText());
      })
      .catch(() => {
        if (!cancelled) setStage({ name: 'error', message: 'Camera unavailable' });
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [stage.name, handlePayload]);

  function reset() {
    setStage({ name: 'scanning' });
  }

  async function submitEarn(customer: CustomerSummary, basketPence: number, confirmDuplicate = false) {
    const res = await fetch('/api/ledger/earn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: customer.passId, basketPence, confirmDuplicate }),
    });
    const body = await res.json();
    if (res.status === 409 && body.error === 'possible_duplicate') {
      setStage({ name: 'confirm-duplicate', customer, basketPence });
      return;
    }
    if (!res.ok) {
      setStage({ name: 'error', message: body.message ?? 'Could not award points' });
      return;
    }
    setStage({
      name: 'result',
      result: {
        kind: 'earn',
        points: body.points,
        multiplier: body.multiplier,
        balancePoints: body.balancePoints,
      },
    });
  }

  async function submitRedeem(customer: CustomerSummary, requestedPence: number) {
    const res = await fetch('/api/ledger/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: customer.passId, requestedPence }),
    });
    const body = await res.json();
    if (!res.ok) {
      setStage({ name: 'error', message: body.message ?? 'Could not redeem points' });
      return;
    }
    setStage({
      name: 'result',
      result: {
        kind: 'redeem',
        points: body.points,
        gbpValuePence: body.gbpValuePence,
        balancePoints: body.balancePoints,
      },
    });
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 flex flex-col items-center gap-6">
      {stage.name === 'scanning' && (
        <div className="w-full max-w-sm">
          <h1 className="text-center text-lg font-semibold text-ink mb-4">Scan customer pass</h1>
          {process.env.NEXT_PUBLIC_E2E_TEST_MODE === '1' ? (
            <TestModeScanInput onSubmit={handlePayload} />
          ) : (
            <video ref={videoRef} className="w-full rounded-xl bg-black aspect-square object-cover" muted />
          )}
        </div>
      )}

      {stage.name === 'error' && (
        <div className="text-center">
          <p className="text-red-600 font-medium">{stage.message}</p>
          <button onClick={reset} className="mt-4 rounded-full bg-coral text-white px-6 py-2">
            Try again
          </button>
        </div>
      )}

      {stage.name === 'customer' && (
        <CustomerCard
          customer={stage.customer}
          onEarn={() => setStage({ name: 'entering-amount', customer: stage.customer, mode: 'earn' })}
          onRedeem={() => setStage({ name: 'entering-amount', customer: stage.customer, mode: 'redeem' })}
          onCancel={reset}
        />
      )}

      {stage.name === 'entering-amount' && (
        <AmountEntry
          mode={stage.mode}
          customer={stage.customer}
          onCancel={() => setStage({ name: 'customer', customer: stage.customer })}
          onConfirm={(pence) =>
            stage.mode === 'earn'
              ? submitEarn(stage.customer, pence)
              : submitRedeem(stage.customer, pence)
          }
        />
      )}

      {stage.name === 'confirm-duplicate' && (
        <div className="text-center max-w-sm">
          <p className="font-medium">Already awarded in the last 2 minutes.</p>
          <p className="text-sm text-ink/60 mt-1">Award again?</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={reset} className="rounded-full border border-ink/20 text-ink px-6 py-2">
              Cancel
            </button>
            <button
              onClick={() => submitEarn(stage.customer, stage.basketPence, true)}
              className="rounded-full bg-coral text-white px-6 py-2"
            >
              Award again
            </button>
          </div>
        </div>
      )}

      {stage.name === 'result' && (
        <div className="text-center">
          {stage.result.kind === 'earn' ? (
            <>
              <p className="text-3xl font-bold text-ink">+{stage.result.points} pts</p>
              <p className="text-sm text-ink/60 mt-1">at {stage.result.multiplier}x</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-ink">
                -{formatPence(stage.result.gbpValuePence)}
              </p>
              <p className="text-sm text-ink/60 mt-1">{stage.result.points} pts redeemed</p>
            </>
          )}
          <p className="mt-3 text-sm">New balance: {formatPence(stage.result.balancePoints)}</p>
          <button onClick={reset} className="mt-6 rounded-full bg-coral text-white px-6 py-2">
            Scan next customer
          </button>
        </div>
      )}
    </main>
  );
}

function CustomerCard({
  customer,
  onEarn,
  onRedeem,
  onCancel,
}: {
  customer: CustomerSummary;
  onEarn: () => void;
  onRedeem: () => void;
  onCancel: () => void;
}) {
  const ordinal = (n: number) => {
    const suffix = ['th', 'st', 'nd', 'rd'][n % 10 > 3 || [11, 12, 13].includes(n % 100) ? 0 : n % 10];
    return `${n}${suffix}`;
  };
  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow text-center">
      <p className="text-lg font-semibold">{customer.displayName ?? 'Guest'}</p>
      <p className="text-sm text-ink/60">{ordinal(customer.visitNumberThisMonth)} visit this month</p>
      <p className="mt-2 text-2xl font-bold text-ink">{formatPence(customer.balancePoints)}</p>
      <div className="mt-6 flex gap-3">
        <button onClick={onEarn} className="flex-1 rounded-full bg-coral text-white py-3 font-medium">
          Earn
        </button>
        <button
          onClick={onRedeem}
          className="flex-1 rounded-full border border-coral text-coral py-3 font-medium"
        >
          Redeem
        </button>
      </div>
      <button onClick={onCancel} className="mt-3 text-sm text-ink/50">
        Cancel
      </button>
    </div>
  );
}

function AmountEntry({
  mode,
  customer,
  onConfirm,
  onCancel,
}: {
  mode: 'earn' | 'redeem';
  customer: CustomerSummary;
  onConfirm: (pence: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const pence = Math.round(parseFloat(value || '0') * 100);
  const valid = pence > 0 && Number.isFinite(pence);

  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow text-center">
      <p className="font-medium">{mode === 'earn' ? 'Basket total' : 'Amount to redeem'}</p>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0.00"
        className="mt-3 w-full text-center text-3xl font-bold border-b-2 border-coral py-2 outline-none"
      />
      {mode === 'redeem' && (
        <p className="mt-2 text-xs text-ink/50">Available: {formatPence(customer.balancePoints)}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full border border-ink/20 text-ink py-3">
          Back
        </button>
        <button
          disabled={!valid}
          onClick={() => onConfirm(pence)}
          className="flex-1 rounded-full bg-coral text-white py-3 disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function TestModeScanInput({ onSubmit }: { onSubmit: (payload: string) => void }) {
  const [payload, setPayload] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(payload);
      }}
      className="rounded-xl bg-white p-6 shadow"
    >
      <label className="text-sm text-neutral-600" htmlFor="e2e-qr-input">
        QR payload (test mode)
      </label>
      <input
        id="e2e-qr-input"
        data-testid="e2e-qr-input"
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        className="mt-2 w-full border border-coral rounded px-3 py-2"
      />
      <button
        type="submit"
        data-testid="e2e-qr-submit"
        className="mt-3 w-full rounded-full bg-coral text-white py-2"
      >
        Submit
      </button>
    </form>
  );
}
