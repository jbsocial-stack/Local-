import { describe, expect, it } from 'vitest';
import { leadEmailSubject, mapVenuesToTier } from '../../src/lib/marketing/lead';

describe('mapVenuesToTier', () => {
  it('maps every venues option to the matching merchant tier', () => {
    expect(mapVenuesToTier('1')).toBe('single');
    expect(mapVenuesToTier('2')).toBe('two');
    expect(mapVenuesToTier('3-4')).toBe('group');
    expect(mapVenuesToTier('5+')).toBe('multi');
  });
});

describe('leadEmailSubject', () => {
  it('matches the AC: 5+ venues tags the subject with [multi-site]', () => {
    const tier = mapVenuesToTier('5+');
    expect(leadEmailSubject('The Roastery', tier)).toBe('[multi-site] New merchant trial request: The Roastery');
  });

  it('does not tag single-site leads', () => {
    expect(leadEmailSubject('The Roastery', 'single')).toBe('New merchant trial request: The Roastery');
  });
});
