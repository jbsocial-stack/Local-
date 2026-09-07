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

  return (
    <main className="min-h-screen bg-cream">
      <header className="px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-coral">{townName} shops</h1>
        <p className="text-sm text-neutral-600">Every independent in the Regulars scheme.</p>
      </header>

      <div className="px-4 mb-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full px-4 py-1 text-sm ${category === null ? 'bg-coral text-white' : 'bg-white text-coral border border-coral'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1 text-sm ${category === c ? 'bg-coral text-white' : 'bg-white text-coral border border-coral'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="px-4">
        <ShopsMap listings={filtered} />
      </div>

      <ul className="mt-6 divide-y divide-neutral-200 px-4 pb-10 max-w-2xl mx-auto">
        {filtered.map((shop) => (
          <li key={shop.id} className="py-4">
            <div className="flex items-start gap-3">
              {shop.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.photoUrl} alt={shop.name} className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{shop.name}</p>
                  <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-xs font-medium">
                    {shop.activeMultiplier}x
                  </span>
                  {shop.boosted && (
                    <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-medium text-white">Boosted</span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">
                  {shop.category} · {shop.address}
                </p>
                {shop.description && <p className="mt-1 text-sm">{shop.description}</p>}
                <HoursSummary hours={shop.hours} />
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="py-8 text-center text-neutral-500">No shops in this category yet.</li>}
      </ul>
    </main>
  );
}

function HoursSummary({ hours }: { hours: ShopListing['hours'] }) {
  const entries = Object.entries(hours) as [string, { open: string; close: string } | null][];
  if (entries.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-neutral-500">
      {entries
        .map(([day, v]) => `${DAY_LABELS[day] ?? day} ${v ? `${v.open}–${v.close}` : 'closed'}`)
        .join(' · ')}
    </p>
  );
}
