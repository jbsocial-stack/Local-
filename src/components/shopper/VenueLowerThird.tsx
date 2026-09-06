import Link from 'next/link';
import type { ShopListing } from '@/lib/directory/get-listings';

// A "lower third" overlay (broadcast-graphics term: a panel across the
// bottom third of the screen) that appears when a map pin is tapped —
// enough to place the shop and see what's on there right now, with one
// tap through to the full relationship page rather than replacing the map.
export function VenueLowerThird({ shop, town, onClose }: { shop: ShopListing; town: string; onClose: () => void }) {
  return (
    // z-[1100]: Leaflet's own panes/controls go up to z-index 1000
    // (leaflet.css) regardless of this element's own stacking context —
    // anything lower gets painted over by the map wherever they overlap
    // on screen, even though this is `position: fixed` on top of it.
    <div className="fixed inset-x-4 bottom-24 z-[1100] rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[0_8px_32px_rgba(43,43,43,0.2)] backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-ink/60"
      >
        ×
      </button>

      <div className="flex items-start gap-3 pr-8">
        {shop.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.photoUrl} alt={shop.name} className="h-14 w-14 rounded-xl object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-xl bg-cream" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{shop.name}</p>
          <p className="text-xs text-ink/50">{shop.category}</p>
          <p className="mt-1 flex items-start gap-1 text-xs text-ink/60">
            <span aria-hidden>📍</span>
            <span className="truncate">{shop.address}</span>
          </p>
        </div>
      </div>

      {shop.offerLabel && (
        <p className="mt-3 inline-block rounded-full bg-coral px-3 py-1 text-xs font-semibold text-cream">
          {shop.offerLabel}
        </p>
      )}

      <Link
        href={`/${town}/app/discover/${shop.slug}`}
        className="mt-3 block rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-cream"
      >
        See your history with {shop.name}
      </Link>
    </div>
  );
}
