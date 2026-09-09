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
      className={`flex aspect-square flex-col items-start justify-between gap-1 rounded-[28px] p-6 text-left sm:p-8 ${
        tone === 'coral' ? 'bg-coral text-cream' : 'bg-paper text-ink'
      }`}
    >
      <span className="font-h3 text-lg leading-tight sm:text-xl">{label}</span>
      <span className={`text-sm font-medium ${tone === 'coral' ? 'text-cream/80' : 'text-ink-muted'}`}>
        {detail} →
      </span>
    </a>
  );
}

// Design system §04 "The card" — the brand's anchor object. Paper fill,
// 28px radius, the one shadow in the system. Coral square top-left, town
// pill top-right, three groups of four navy dots + a tracked 4-char code
// in the middle, cardholder overline + name bottom-left, wordmark
// bottom-right in Ultra Heavy coral.
function PassCardMock() {
  return (
    <div
      className="aspect-[1.6/1] w-full rounded-[28px] bg-paper p-7 text-left text-ink"
      style={{ boxShadow: '0 8px 24px rgba(28,43,68,.18)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="h-9 w-12 rounded-lg bg-coral" aria-hidden />
        <span className="rounded-full bg-line px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
          Chichester
        </span>
      </div>
      <div className="mt-5 flex items-center gap-[clamp(10px,3.5%,22px)]">
        {[0, 1, 2].map((group) => (
          <span key={group} className="flex gap-[7px]" aria-hidden>
            {[0, 1, 2, 3].map((dot) => (
              <span key={dot} className="h-[9px] w-[9px] rounded-full bg-ink" />
            ))}
          </span>
        ))}
        <span className="text-[17px] font-medium tracking-[0.1em]">24A6</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Cardholder</p>
          <p className="mt-1.5 text-[15px] font-medium">Alex Morgan</p>
        </div>
        <span className="font-logo uppercase text-lg text-coral">Regulars</span>
      </div>
    </div>
  );
}

function TownPill({ town }: { town?: TownConfig }) {
  if (!town) {
    return (
      <p className="mt-6 inline-block rounded-full bg-paper px-[18px] py-2 text-sm font-medium text-coral">
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
  return <p className="mt-6 inline-block rounded-full bg-paper px-[18px] py-2 text-sm font-medium text-coral">{label}</p>;
}
