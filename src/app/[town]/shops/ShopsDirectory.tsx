'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

export interface ShopListing {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  hours: Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', { open: string; close: string } | null>>;
  photoUrl: string | null;
  activeMultiplier: number;
  boosted: boolean;
}

const ShopsMap = dynamic(() => import('./ShopsMap'), { ssr: false });

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export function ShopsDirectory({ townName, listings }: { townName: string; listings: ShopListing[] }) {
  const categories = useMemo(
    () => Array.from(new Set(listings.map((l) => l.category))).sort(),
    [listings],
  );
  const [category, setCategory] = useState<string | null>(null);

  const filtered = category ? listings.filter((l) => l.category === category) : listings;

  if (listings.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl text-ink">{townName} shops</h1>
          <p className="mt-3 font-h3 text-lg text-ink">Coming soon</p>
          <p className="mt-2 text-sm text-ink-muted">
            We&apos;re signing up the first independents in {townName} — check back soon to see who&apos;s joined.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="px-4 py-6 text-center">
        <h1 className="font-display text-2xl text-ink">{townName} shops</h1>
        <p className="text-sm text-ink-muted">Every independent in the Regulars scheme.</p>
      </header>

      <div className="px-4 mb-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${category === null ? 'bg-ink text-cream' : 'bg-paper text-ink-muted hover:text-ink'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${category === c ? 'bg-ink text-cream' : 'bg-paper text-ink-muted hover:text-ink'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="px-4">
        <ShopsMap listings={filtered} />
      </div>

      <ul className="mt-6 divide-y divide-line px-4 pb-10 max-w-2xl mx-auto">
        {filtered.map((shop) => (
          <li key={shop.id} className="py-4">
            <div className="flex items-start gap-3">
              {shop.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.photoUrl} alt={shop.name} className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-h3 text-ink">{shop.name}</p>
                  <span className="rounded-full bg-coral-soft px-2 py-0.5 text-xs font-medium text-coral">
                    {shop.activeMultiplier}x
                  </span>
                  {shop.boosted && (
                    <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-medium text-cream">Boosted</span>
                  )}
                </div>
                <p className="text-sm text-ink-muted">
                  {shop.category} · {shop.address}
                </p>
                {shop.description && <p className="mt-1 text-sm text-ink">{shop.description}</p>}
                <HoursSummary hours={shop.hours} />
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="py-8 text-center text-ink-muted">No shops in this category yet.</li>}
      </ul>
    </main>
  );
}

function HoursSummary({ hours }: { hours: ShopListing['hours'] }) {
  const entries = Object.entries(hours) as [string, { open: string; close: string } | null][];
  if (entries.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-ink-muted">
      {entries
        .map(([day, v]) => `${DAY_LABELS[day] ?? day} ${v ? `${v.open}–${v.close}` : 'closed'}`)
        .join(' · ')}
    </p>
  );
}
