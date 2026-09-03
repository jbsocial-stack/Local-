'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ShopListing } from '@/lib/directory/get-listings';

const DiscoverMap = dynamic(() => import('./DiscoverMap'), { ssr: false });

export function DiscoverDirectory({ town, listings }: { town: string; listings: ShopListing[] }) {
  const categories = useMemo(() => Array.from(new Set(listings.map((l) => l.category))).sort(), [listings]);
  const [category, setCategory] = useState<string | null>(null);
  const filtered = category ? listings.filter((l) => l.category === category) : listings;

  return (
    <main className="px-4 pt-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl">Discover</h1>
        <p className="text-sm text-ink/60">Every independent in the scheme, near you.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${category === null ? 'bg-coral text-cream' : 'bg-white text-ink/70'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${category === c ? 'bg-coral text-cream' : 'bg-white text-ink/70'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <DiscoverMap listings={filtered} town={town} />
        </div>

        <ul className="mt-4 divide-y divide-ink/10 rounded-xl bg-white shadow-sm">
          {filtered.map((shop) => (
            <li key={shop.id}>
              <Link href={`/${town}/app/discover/${shop.slug}`} className="flex items-center gap-3 px-4 py-3">
                {shop.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.photoUrl} alt={shop.name} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-cream" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{shop.name}</p>
                    <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[11px] font-medium">
                      {shop.activeMultiplier}x
                    </span>
                    {shop.boosted && (
                      <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-medium text-cream">
                        Boosted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/50">{shop.category}</p>
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink/50">No shops in this category yet.</li>
          )}
        </ul>
      </div>
    </main>
  );
}
