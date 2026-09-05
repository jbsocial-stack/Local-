// Marketing homepage PRD, H4: single source of truth for the hero pill, the
// shopper form's success state, and the demand map. Any town typed into the
// shopper form's "Other" free-text field (not listed here) is implicitly
// `planned` — it just has no dedicated config row yet.
export type TownStatus = 'live' | 'coming-soon' | 'planned';

export interface TownConfig {
  slug: string;
  name: string;
  status: TownStatus;
  region: string;
  lat: number;
  lng: number;
  /** Shown in the hero pill for `coming-soon` towns, e.g. "Autumn 2026". */
  launchWindow?: string;
}

export const TOWNS: TownConfig[] = [
  {
    slug: 'chichester',
    name: 'Chichester',
    status: 'live',
    region: 'South East',
    lat: 50.8365,
    lng: -0.7792,
    launchWindow: 'Autumn 2026',
  },
  { slug: 'brighton', name: 'Brighton', status: 'planned', region: 'South East', lat: 50.8225, lng: -0.1372 },
  { slug: 'winchester', name: 'Winchester', status: 'planned', region: 'South East', lat: 51.0632, lng: -1.308 },
  { slug: 'lewes', name: 'Lewes', status: 'planned', region: 'South East', lat: 50.8736, lng: 0.0148 },
  { slug: 'guildford', name: 'Guildford', status: 'planned', region: 'South East', lat: 51.2362, lng: -0.5704 },
  { slug: 'horsham', name: 'Horsham', status: 'planned', region: 'South East', lat: 51.0637, lng: -0.3274 },
  { slug: 'petworth', name: 'Petworth', status: 'planned', region: 'South East', lat: 50.9967, lng: -0.6106 },
  { slug: 'arundel', name: 'Arundel', status: 'planned', region: 'South East', lat: 50.8546, lng: -0.5559 },
];

/**
 * Refer-a-friend / early-access mechanic: only this many passes go out in
 * each town at launch. Once a live town hits it, further shopper signups
 * fall back onto the same waitlist as a not-yet-live town (see
 * /api/signup) — referring friends is the only way to move up it.
 */
export const LAUNCH_CARD_LIMIT = 500;

export function findTown(slug: string): TownConfig | undefined {
  return TOWNS.find((t) => t.slug === slug);
}

/** Every registered slug that resolves to a real `/[town]` marketing page. */
export function townSlugs(): string[] {
  return TOWNS.map((t) => t.slug);
}
