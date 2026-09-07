'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ShopListing } from '@/lib/directory/get-listings';
import { VenueLowerThird } from './VenueLowerThird';

const DiscoverMap = dynamic(() => import('./DiscoverMap'), { ssr: false });

export function DiscoverDirectory({ town, listings }: { town: string; listings: ShopListing[] }) {
  const categories = useMemo(() => Array.from(new Set(listings.map((l) => l.category))).sort(), [listings]);
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<ShopListing | null>(null);
  const filtered = category ? listings.filter((l) => l.category === category) : listings;

  function pickCategory(c: string | null) {
    setCategory(c);
    setSelected(null);
  }

  return (
    <main className="pt-10">
      <div className="mx-auto max-w-md px-4">
        <h1 className="font-display text-2xl">Discover</h1>
        <p className="text-sm text-ink/60">Every independent in the scheme, near you.</p>
      </div>

      {/* Full-bleed map — edge to edge, breaking out of the page's usual
          max-w-md/px-4 container so it reads as a real map, not a card. */}
      <div className="relative mt-4 h-[60vh] w-full">
        <DiscoverMap listings={filtered} selectedId={selected?.id ?? null} onSelect={setSelected} />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-2 p-3">
          <button
            onClick={() => pickCategory(null)}
            className={`pointer-events-auto rounded-full px-3 py-1 text-xs font-medium shadow ${
              category === null ? 'bg-ink text-cream' : 'bg-white/90 text-ink/70 backdrop-blur'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => pickCategory(c)}
              className={`pointer-events-auto rounded-full px-3 py-1 text-xs font-medium shadow ${
                category === c ? 'bg-ink text-cream' : 'bg-white/90 text-ink/70 backdrop-blur'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {selected && <VenueLowerThird shop={selected} town={town} onClose={() => setSelected(null)} />}
      </div>

      <div className="mx-auto max-w-md px-4">
        <ul className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70">
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
                    <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-medium text-coral">
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
