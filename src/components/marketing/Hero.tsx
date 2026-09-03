'use client';

import type { TownConfig } from '../../../config/towns';
import { track } from '@/lib/marketing/analytics';

// S1: two CTAs of equal weight, a town pill driven by config, and a static
// pass-card mockup (same visual language as the real WalletCard in the
// signed-in app). `town` is omitted on the generic homepage and passed on
// `/[town]` to pre-fill the pill (H4/H8).
export function Hero({ town }: { town?: TownConfig }) {
  return (
    <section className="px-4 py-4 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-coral px-6 py-16 text-cream sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-400/40 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cream/10 blur-xl"
        />

        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cream">
              High-street loyalty, together
            </span>
            <h1 className="mt-4 font-display text-[14vw] leading-[0.85] md:text-8xl">Local</h1>
            <p className="mt-4 text-lg font-medium text-cream">Unlocking collective loyalty marketing.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#shopper-form"
                onClick={() => track('cta_click', { type: 'shopper', town: town?.slug ?? '' })}
                className="rounded-full bg-ink px-6 py-3 text-center font-medium text-cream"
              >
                I&apos;m a shopper →
              </a>
              <a
                href="#merchant-form"
                onClick={() => track('cta_click', { type: 'merchant', town: town?.slug ?? '' })}
                className="rounded-full bg-cream px-6 py-3 text-center font-medium text-ink"
              >
                I run a business →
              </a>
            </div>

            <TownPill town={town} />
          </div>

          <div className="flex justify-center">
            <PassCardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function PassCardMock() {
  return (
    <div className="w-full max-w-xs rounded-3xl bg-ink p-6 text-cream shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cream/60">Local pass</span>
        <span className="rounded-full bg-accent-yellow px-3 py-1 text-xs font-semibold text-ink">Chichester</span>
      </div>
      <p className="mt-10 font-display text-5xl">£24.60</p>
      <p className="mt-1 text-sm text-cream/70">2,460 points · ready to spend</p>
      <div className="mt-8 flex items-center gap-3 border-t border-cream/15 pt-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/15 text-sm font-semibold">
          L
        </span>
        <span className="text-sm text-cream/70">Lives in Apple &amp; Google Wallet</span>
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
