import { describe, expect, it } from 'vitest';
import {
  buildDemandDots,
  dotRadius,
  MAP_HEIGHT,
  MAP_WIDTH,
  projectLatLng,
  topTowns,
  UK_BOUNDS,
  type TownForMap,
} from '../../src/lib/marketing/demand-map';

describe('projectLatLng', () => {
  it('maps the bounding box corners to the SVG viewport corners', () => {
    expect(projectLatLng(UK_BOUNDS.maxLat, UK_BOUNDS.minLng)).toEqual({ x: 0, y: 0 });
    expect(projectLatLng(UK_BOUNDS.minLat, UK_BOUNDS.maxLng)).toEqual({ x: MAP_WIDTH, y: MAP_HEIGHT });
  });
});

describe('dotRadius', () => {
  it('is area-proportional: 4x the count is 2x the radius growth, not 4x', () => {
    const r1 = dotRadius(10, 40);
    const r4 = dotRadius(40, 40);
    // r4 is the max radius (count === maxCount); r1 should sit halfway
    // between min and max, not a quarter of the way (linear would be that).
    expect(r1).toBeCloseTo((4 + 22) / 2, 5);
    expect(r4).toBeCloseTo(22, 5);
  });

  it('falls back to the minimum radius when there is no data', () => {
    expect(dotRadius(0, 0)).toBe(4);
  });
});

const TOWNS: TownForMap[] = [
  { slug: 'chichester', name: 'Chichester', lat: 50.8365, lng: -0.7792, status: 'coming-soon' },
  { slug: 'brighton', name: 'Brighton', lat: 50.8225, lng: -0.1372, status: 'live' },
];

describe('buildDemandDots', () => {
  it('joins counts against town config and flags live towns', () => {
    const dots = buildDemandDots(
      [
        { townSlug: 'chichester', count: 500 },
        { townSlug: 'brighton', count: 100 },
      ],
      TOWNS,
    );
    expect(dots).toHaveLength(2);
    expect(dots.find((d) => d.slug === 'brighton')?.live).toBe(true);
    expect(dots.find((d) => d.slug === 'chichester')?.live).toBe(false);
  });

  it('silently drops counts for towns not in config (e.g. free-text votes)', () => {
    const dots = buildDemandDots([{ townSlug: 'nowhereville', count: 5 }], TOWNS);
    expect(dots).toHaveLength(0);
  });
});

describe('topTowns', () => {
  it('sorts descending by count and limits results', () => {
    const result = topTowns(
      [
        { townSlug: 'chichester', count: 10 },
        { townSlug: 'brighton', count: 50 },
      ],
      TOWNS,
      1,
    );
    expect(result).toEqual([{ name: 'Brighton', count: 50 }]);
  });
});
