'use client';

import { useRef, useState } from 'react';
import { TOWNS, type TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

type SuccessState =
  | { kind: 'live'; townName: string; townSlug: string }
  | { kind: 'coming-soon'; townName: string }
  | { kind: 'planned'; townName: string; count?: number };

// S6. Progressive enhancement: this is a real <form method="POST"
// action="/api/signup"> — without JS the browser posts it directly and the
// route handler renders a server-side success page (AC). With JS, onSubmit
// intercepts, posts JSON instead, and swaps in the richer inline state
// below without a page navigation.
export function ShopperForm({ defaultTown }: { defaultTown?: TownConfig }) {
  const [townSlug, setTownSlug] = useState(defaultTown?.slug ?? '');
  const [townFreeText, setTownFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const startedRef = useRef(false);

  function onFormFocus() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('form_start', { form: 'shopper', town: townSlug });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    track('form_submit', { form: 'shopper', town: townSlug || townFreeText });
    setStatus('submitting');
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        townSlug: townSlug === '__other__' ? undefined : townSlug || undefined,
        townFreeText: townSlug === '__other__' ? townFreeText : undefined,
        postcode: postcode || undefined,
        consentMarketing: consent,
        source: 'homepage',
      }),
    });
    if (!res.ok) {
      setStatus('error');
      return;
    }
    const body = await res.json();
    setStatus('idle');
    setSuccess(
      body.status === 'live'
        ? { kind: 'live', townName: body.townName, townSlug }
        : body.status === 'coming-soon'
          ? { kind: 'coming-soon', townName: body.townName }
          : { kind: 'planned', townName: body.townName, count: body.count },
    );
  }

  if (success) return <ShopperSuccess state={success} />;

  return (
    <form
      id="shopper-form"
      method="POST"
      action="/api/signup"
      onSubmit={onSubmit}
      onFocus={onFormFocus}
      className="space-y-4"
    >
      <input type="hidden" name="source" value="homepage" />
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Town</span>
        <select
          name="townSlug"
          required
          value={townSlug}
          onChange={(e) => setTownSlug(e.target.value)}
          className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
        >
          <option value="" disabled>
            Choose your town
          </option>
          {TOWNS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
          <option value="__other__">Other…</option>
        </select>
      </label>

      {townSlug === '__other__' && (
        <label className="block">
          <span className="text-sm font-medium">Which town?</span>
          <input
            type="text"
            name="townFreeText"
            required
            value={townFreeText}
            onChange={(e) => setTownFreeText(e.target.value)}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium">Postcode (optional)</span>
        <input
          type="text"
          name="postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          className="mt-1 w-full rounded border border-ink/20 px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="consentMarketing"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Keep me posted by email
      </label>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-full bg-coral px-6 py-3 font-medium text-cream disabled:opacity-50"
      >
        {status === 'submitting' ? 'Signing up…' : 'Sign up'}
      </button>
      {status === 'error' && <p className="text-sm text-red-600">Something went wrong — try again.</p>}
    </form>
  );
}

function ShopperSuccess({ state }: { state: SuccessState }) {
  if (state.kind === 'live') {
    return (
      <div id="shopper-form">
        <p className="font-medium">You&apos;re in! Add your pass now:</p>
        <WalletButtons townSlug={state.townSlug} />
      </div>
    );
  }
  if (state.kind === 'coming-soon') {
    return (
      <div id="shopper-form">
        <p className="font-medium">You&apos;re in. We&apos;ll tell you the day {state.townName} goes live.</p>
      </div>
    );
  }
  return (
    <div id="shopper-form">
      <p className="font-medium">Thanks — you just voted for {state.townName}.</p>
      <p className="mt-1 text-ink/70">
        {state.count ?? 1} {state.count === 1 ? 'person' : 'people'} in {state.townName} want Local.
      </p>
    </div>
  );
}

function WalletButtons({ townSlug }: { townSlug: string }) {
  const [error, setError] = useState<string | null>(null);

  async function issue(platform: 'apple' | 'google') {
    setError(null);
    track('wallet_add', { platform, town: townSlug });
    const res = await fetch('/api/pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ townSlug, platform }),
    });
    if (platform === 'apple') {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Could not create your pass');
        return;
      }
      const blob = await res.blob();
      window.location.href = URL.createObjectURL(blob);
      return;
    }
    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Could not create your pass');
      return;
    }
    window.location.href = body.saveUrl;
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <button onClick={() => issue('apple')} className="rounded-full bg-black px-5 py-2.5 text-cream">
        Add to Apple Wallet
      </button>
      <button onClick={() => issue('google')} className="rounded-full bg-coral px-5 py-2.5 text-cream">
        Add to Google Wallet
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
