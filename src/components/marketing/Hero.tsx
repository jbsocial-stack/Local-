'use client';

import type { TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

// S1: a centred hero — headline, a 2-up choice between shopper/business (not
// full-width CTAs), and a town pill. `town` is omitted on the generic
// homepage and passed on `/[town]` to pre-fill the pill (H4/H8).
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

function TownPill({ town }: { town?: TownConfig }) {
  if (!town) {
    return (
      <p className="mt-6 inline-flex h-9 items-center whitespace-nowrap rounded-full bg-paper px-[18px] text-sm font-medium text-ink">
        Help us pick the next town
      </p>
    );
  }
  const label =
    town.status === 'live'
      ? `Live now in ${town.name}`
      : town.status === 'coming-soon'
        ? `Launching soon in ${town.name}`
        : `${town.name} isn't planned yet`;
  return (
    <p className="mt-6 inline-flex h-9 items-center whitespace-nowrap rounded-full bg-paper px-[18px] text-sm font-medium text-ink">
      {label}
    </p>
  );
}
