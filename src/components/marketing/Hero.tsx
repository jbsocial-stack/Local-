'use client';

import type { TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

// S1: a centred hero — headline, a 2-up choice between shopper/business (not
// full-width CTAs), a town pill, and a personalised-feeling pass-card
// mockup. `town` is omitted on the generic homepage and passed on `/[town]`
// to pre-fill the pill (H4/H8).
export function Hero({ town }: { town?: TownConfig }) {
  return (
    <section className="px-4 py-4 sm:px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-cream sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cream/10 blur-xl"
        />

        <div className="relative mx-auto flex max-w-md flex-col items-center">
          <h1 className="font-logo uppercase text-[14vw] leading-[0.85] sm:text-7xl">Regulars</h1>
          <p className="mt-4 text-lg font-medium text-cream">
            Get Regular. Eat, shop and earn points in your town.
          </p>

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <ChoiceTile
              href="/shoppers"
              label="I'm a shopper"
              detail="Get the pass"
              tone="coral"
              onClick={() => track('cta_click', { type: 'shopper', town: town?.slug ?? '' })}
            />
            <ChoiceTile
              href="/business"
              label="I run a business"
              detail="Start a trial"
              tone="cream"
              onClick={() => track('cta_click', { type: 'merchant', town: town?.slug ?? '' })}
            />
          </div>

          <TownPill town={town} />

          <div className="mt-10 w-full max-w-xs">
            <PassCardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceTile({
  href,
  label,
  detail,
  tone,
  onClick,
}: {
  href: string;
  label: string;
  detail: string;
  tone: 'coral' | 'cream';
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl px-3 text-center ${
        tone === 'coral' ? 'bg-coral text-cream' : 'bg-cream text-ink'
      }`}
    >
      <span className="font-display text-lg leading-tight">{label}</span>
      <span className={`text-sm ${tone === 'coral' ? 'text-cream/70' : 'text-ink/60'}`}>{detail} →</span>
    </a>
  );
}

function PassCardMock() {
  return (
    <div className="aspect-[1.586/1] w-full rounded-2xl bg-cream p-5 text-left text-ink shadow-2xl">
      <div className="flex items-start justify-between">
        <span className="h-6 w-8 rounded-md bg-coral/90" aria-hidden />
        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
          Chichester
        </span>
      </div>
      <p className="mt-4 font-mono text-lg tracking-[0.2em] text-ink/80">•••• •••• •••• 24A6</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/50">Cardholder</p>
          <p className="text-sm font-medium">Alex Morgan</p>
        </div>
        <span className="font-logo uppercase text-xl text-coral">Regulars</span>
      </div>
    </div>
  );
}

function TownPill({ town }: { town?: TownConfig }) {
  if (!town) {
    return (
      <p className="mt-6 inline-block rounded-full bg-cream px-4 py-1.5 text-sm font-medium text-coral">
        Sign up and help us pick the next town
      </p>
    );
  }
  const label =
    town.status === 'live'
      ? `Live now in ${town.name}`
      : town.status === 'coming-soon'
        ? `Launching in ${town.name}${town.launchWindow ? ` · ${town.launchWindow}` : ''}`
        : `Not yet planned for ${town.name} — be the first to sign up`;
  return <p className="mt-6 inline-block rounded-full bg-cream px-4 py-1.5 text-sm font-medium text-coral">{label}</p>;
}
