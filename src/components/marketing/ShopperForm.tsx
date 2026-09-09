'use client';

import { useEffect, useRef, useState } from 'react';
import { TOWNS, type TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

type SuccessState = {
  kind: 'coming-soon' | 'planned' | 'capacity';
  townName: string;
  count?: number;
  path: string; // where to send a referred friend, e.g. /chichester/shoppers
  referralCode?: string;
  position?: number;
  totalInQueue?: number;
};

// S6. Progressive enhancement: this is a real <form method="POST"
// action="/api/signup"> — without JS the browser posts it directly and the
// route handler renders a server-side success page (AC). With JS, onSubmit
// intercepts, posts JSON instead.
//
// One form, one step: picking a live town reveals a password field, and
// submitting creates the account, the pass, and a signed-in session all in
// one request — no separate claim page, no wallet-file dependency. Picking
// anywhere else — or a live town whose first LAUNCH_CARD_LIMIT passes are
// already claimed (the API reports that back as `status: 'capacity'`) —
// is still the same waitlist signup, with a referral link to move up it.
export function ShopperForm({ defaultTown }: { defaultTown?: TownConfig }) {
  const [townSlug, setTownSlug] = useState(defaultTown?.slug ?? '');
  const [townFreeText, setTownFreeText] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [postcode, setPostcode] = useState('');
  const [consent, setConsent] = useState(false);
  const [refCode, setRefCode] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('Something went wrong — try again.');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const startedRef = useRef(false);

  const selectedTown = TOWNS.find((t) => t.slug === townSlug);
  const isLive = selectedTown?.status === 'live';

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setRefCode(ref);
  }, []);

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
        refCode,
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
    setSuccess({
      kind: body.status,
      townName: body.townName,
      count: body.count,
      path: townSlug && townSlug !== '__other__' ? `/${townSlug}/shoppers` : '/shoppers',
      referralCode: body.referralCode,
      position: body.position,
      totalInQueue: body.totalInQueue,
    });
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
      {refCode && <input type="hidden" name="refCode" value={refCode} />}
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
          className="mt-1 h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="sr-only">Town</span>
        <select
          name="townSlug"
          required
          value={townSlug}
          onChange={(e) => setTownSlug(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink focus:border-2 focus:border-ink focus:outline-none"
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
            className="mt-1 h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink focus:border-2 focus:border-ink focus:outline-none"
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
            className="mt-1 h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink placeholder:text-ink-muted focus:border-2 focus:border-ink focus:outline-none"
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
          className="mt-1 h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink focus:border-2 focus:border-ink focus:outline-none"
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
        className="flex h-11 w-full items-center justify-center rounded-full bg-ink px-6 font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-40 sm:h-12 sm:w-auto"
      >
        {status === 'submitting' ? 'Signing up…' : isLive ? 'Create my account' : 'Send my pass'}
      </button>
      <p className="text-sm text-ink-muted">Free for shoppers. No card required.</p>
      {status === 'error' && <p className="text-sm text-error">{errorMessage}</p>}
    </form>
  );
}

function ShopperSuccess({ state }: { state: SuccessState }) {
  const heading =
    state.kind === 'coming-soon' ? (
      <p className="font-medium">You&apos;re in. We&apos;ll tell you the day {state.townName} goes live.</p>
    ) : state.kind === 'capacity' ? (
      <>
        <p className="font-medium">You&apos;re in.</p>
        <p className="mt-1 text-ink/70">
          {state.townName}&apos;s first passes are already claimed — you&apos;re on the early-access list.
        </p>
      </>
    ) : (
      <>
        <p className="font-medium">Thanks — you just voted for {state.townName}.</p>
        <p className="mt-1 text-ink/70">
          {state.count ?? 1} {state.count === 1 ? 'person' : 'people'} in {state.townName} want Regulars.
        </p>
      </>
    );

  return (
    <div id="shopper-form">
      {heading}
      {state.referralCode && (
        <ReferralShare
          code={state.referralCode}
          path={state.path}
          position={state.position}
          totalInQueue={state.totalInQueue}
        />
      )}
    </div>
  );
}

function ReferralShare({
  code,
  path,
  position,
  totalInQueue,
}: {
  code: string;
  path: string;
  position?: number;
  totalInQueue?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    setLink(`${window.location.origin}${path}?ref=${code}`);
  }, [path, code]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure
      // context) — the link is still selectable in the input either way.
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-paper p-4">
      {position !== undefined && totalInQueue !== undefined && (
        <p className="text-sm font-medium">
          You&apos;re #{position} of {totalInQueue} in line.
        </p>
      )}
      <p className="mt-1 text-sm text-ink-muted">
        Refer friends to move up — everyone who signs up with your link jumps you both ahead of anyone who hasn&apos;t.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full min-w-0 rounded-full border border-line bg-cream px-4 text-sm text-ink-muted"
        />
        <button
          type="button"
          onClick={copyLink}
          className="h-11 shrink-0 rounded-full bg-ink px-4 text-sm font-medium text-cream transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
