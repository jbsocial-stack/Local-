'use client';

import { useRef, useState } from 'react';
import { TOWNS, type TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

type SuccessState =
  | { kind: 'coming-soon'; townName: string }
  | { kind: 'planned'; townName: string; count?: number };

// S6. Progressive enhancement: this is a real <form method="POST"
// action="/api/signup"> — without JS the browser posts it directly and the
// route handler renders a server-side success page (AC). With JS, onSubmit
// intercepts, posts JSON instead.
//
// One form, one step: picking a live town reveals a password field, and
// submitting creates the account, the pass, and a signed-in session all in
// one request — no separate claim page, no wallet-file dependency. Picking
// anywhere else is still just the waitlist signup it always was.
export function ShopperForm({ defaultTown }: { defaultTown?: TownConfig }) {
  const [townSlug, setTownSlug] = useState(defaultTown?.slug ?? '');
  const [townFreeText, setTownFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [postcode, setPostcode] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Something went wrong — try again.');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const startedRef = useRef(false);

  const selectedTown = TOWNS.find((t) => t.slug === townSlug);
  const isLive = selectedTown?.status === 'live';

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
        password: isLive ? password : undefined,
        townSlug: townSlug === '__other__' ? undefined : townSlug || undefined,
        townFreeText: townSlug === '__other__' ? townFreeText : undefined,
        postcode: postcode || undefined,
        consentMarketing: consent,
        source: 'homepage',
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus('error');
      // 409 = an account already exists with a different password.
      setErrorMessage(
        res.status === 409
          ? 'You already have an account — sign in instead, or reset your password.'
          : (body.message ?? 'Something went wrong — try again.'),
      );
      return;
    }
    const body = await res.json();
    if (body.status === 'live') {
      window.location.href = body.redirectTo;
      return;
    }
    setStatus('idle');
    setSuccess(
      body.status === 'coming-soon'
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
      <h3 className="font-display text-3xl">Get the pass</h3>
      <p className="text-ink/70">Tell us where you shop and we&apos;ll set you up.</p>

      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-full border-none bg-white/70 px-5 py-3 placeholder:text-ink/40"
        />
      </label>

      <label className="block">
        <span className="sr-only">Town</span>
        <select
          name="townSlug"
          required
          value={townSlug}
          onChange={(e) => setTownSlug(e.target.value)}
          className="mt-1 w-full rounded-full border-none bg-white/70 px-5 py-3"
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
            className="mt-1 w-full rounded-full border-none bg-white/70 px-5 py-3"
          />
        </label>
      )}

      {isLive && (
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-white/70 px-5 py-3 placeholder:text-ink/40"
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
          className="mt-1 w-full rounded-full border-none bg-white/70 px-5 py-3"
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
        className="w-full rounded-full bg-ink px-6 py-3 font-medium text-cream disabled:opacity-50 sm:w-auto"
      >
        {status === 'submitting' ? 'Signing up…' : isLive ? 'Create my account' : 'Send my pass'}
      </button>
      <p className="text-sm text-ink/60">Free for shoppers. No card required.</p>
      {status === 'error' && <p className="text-sm text-red-700">{errorMessage}</p>}
    </form>
  );
}

function ShopperSuccess({ state }: { state: SuccessState }) {
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
