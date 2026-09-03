// S10: "map of the UK (SVG outline) with coral dots sized by shopper
// sign-ups per town." A simple equirectangular projection over a fixed GB
// bounding box — not survey-accurate, but a dot map doesn't need to be.
export const UK_BOUNDS = { minLat: 49.8, maxLat: 60.9, minLng: -8.6, maxLng: 1.8 };
export const MAP_WIDTH = 400;
export const MAP_HEIGHT = 600;

export function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - UK_BOUNDS.minLng) / (UK_BOUNDS.maxLng - UK_BOUNDS.minLng)) * MAP_WIDTH;
  const y = ((UK_BOUNDS.maxLat - lat) / (UK_BOUNDS.maxLat - UK_BOUNDS.minLat)) * MAP_HEIGHT;
  return { x, y };
}

const MIN_RADIUS = 4;
const MAX_RADIUS = 22;

/** Area-proportional (sqrt) so a 4x count doesn't look like a 4x-bigger dot. */
export function dotRadius(count: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_RADIUS;
  const scale = Math.sqrt(count) / Math.sqrt(maxCount);
  return MIN_RADIUS + scale * (MAX_RADIUS - MIN_RADIUS);
}

export interface DemandCount {
  townSlug: string;
  count: number;
}

export interface DemandDot {
  slug: string;
  name: string;
  count: number;
  x: number;
  y: number;
  radius: number;
  live: boolean;
}

export interface TownForMap {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  status: 'live' | 'coming-soon' | 'planned';
}

export function buildDemandDots(counts: DemandCount[], towns: TownForMap[]): DemandDot[] {
  const maxCount = Math.max(0, ...counts.map((c) => c.count));
  const townsBySlug = new Map(towns.map((t) => [t.slug, t]));

  return counts
    .map((c) => {
      const town = townsBySlug.get(c.townSlug);
      if (!town) return null;
      const { x, y } = projectLatLng(town.lat, town.lng);
      return {
        slug: town.slug,
        name: town.name,
        count: c.count,
        x,
        y,
        radius: dotRadius(c.count, maxCount),
        live: town.status === 'live',
      };
    })
    .filter((d): d is DemandDot => d !== null);
}

export function topTowns(counts: DemandCount[], towns: TownForMap[], limit = 10): { name: string; count: number }[] {
  const townsBySlug = new Map(towns.map((t) => [t.slug, t]));
  return counts
    .map((c) => ({ name: townsBySlug.get(c.townSlug)?.name ?? c.townSlug, count: c.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
