'use client';

import { useRef, useState } from 'react';
import { TOWNS } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';
import { Eyebrow } from './Eyebrow';

const CATEGORIES = ['cafe', 'restaurant', 'bar', 'retail', 'services', 'other'] as const;
const VENUES = ['1', '2', '3-4', '5+'] as const;

// S9. Same progressive-enhancement shape as ShopperForm: a real form POST
// that works with JS disabled, intercepted client-side when JS is present.
export function MerchantForm() {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [townSlug, setTownSlug] = useState('');
  const [venues, setVenues] = useState<(typeof VENUES)[number]>('1');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('cafe');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'sent'>('idle');
  const startedRef = useRef(false);

  function onFormFocus() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('form_start', { form: 'merchant', town: townSlug });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    track('form_submit', { form: 'merchant', town: townSlug });
    setStatus('submitting');
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName,
        contactName,
        email,
        phone: phone || undefined,
        townSlug,
        venues,
        category,
        notes: notes || undefined,
        source: 'homepage',
      }),
    });
    setStatus(res.ok ? 'sent' : 'error');
  }

  if (status === 'sent') {
    return (
      <div id="merchant-form">
        <Eyebrow tone="cream">Launching October 2027</Eyebrow>
        <h2 className="mt-2 font-display text-3xl">Congratulations — you&apos;re a founding Regulars business.</h2>
        <p className="mt-3 font-medium text-cream/80">
          We&apos;ll be in touch within 2 working days to get {businessName || 'your business'} set up ahead of launch.
        </p>
      </div>
    );
  }

  return (
    <div id="merchant-form">
      <h2 className="font-display text-3xl">Start a free trial</h2>
      <p className="mt-2 text-cream/80">We&apos;ll be in touch within 2 working days.</p>
      <form
        method="POST"
        action="/api/lead"
        onSubmit={onSubmit}
        onFocus={onFormFocus}
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
      <input type="hidden" name="source" value="homepage" />
      <Field label="Business name">
        <input
          name="businessName"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        />
      </Field>
      <Field label="Contact name">
        <input
          name="contactName"
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        />
      </Field>
      <Field label="Phone (optional)">
        <input
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        />
      </Field>
      <Field label="Town">
        <select
          name="townSlug"
          required
          value={townSlug}
          onChange={(e) => setTownSlug(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        >
          <option value="" disabled>
            Choose a town
          </option>
          {TOWNS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Number of venues">
        <select
          name="venues"
          value={venues}
          onChange={(e) => setVenues(e.target.value as (typeof VENUES)[number])}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        >
          {VENUES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
          className="mt-1 h-12 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Anything we should know? (optional)" full>
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-cream/15 bg-ink-2 px-4 py-3 text-cream placeholder:text-cream-muted focus:border-2 focus:border-cream focus:outline-none"
          rows={3}
        />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex h-11 items-center justify-center rounded-full bg-cream px-6 font-medium text-ink transition duration-150 ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-40 sm:h-12"
        >
          {status === 'submitting' ? 'Sending…' : 'Request a trial'}
        </button>
        {status === 'error' && <p className="mt-2 text-sm text-cream">Something went wrong — try again.</p>}
      </div>
      </form>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-medium ${full ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}
