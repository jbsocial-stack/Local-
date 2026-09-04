import { describe, expect, it } from 'vitest';
import { resolveSignupTown } from '../../src/lib/marketing/signup';

describe('resolveSignupTown', () => {
  it('resolves a live config town by slug', () => {
    const result = resolveSignupTown('chichester', null);
    expect(result.kind).toBe('live');
    expect(result.label).toBe('Chichester');
  });

  it('resolves a planned config town by slug', () => {
    const result = resolveSignupTown('winchester', null);
    expect(result.kind).toBe('planned');
    expect(result.town?.slug).toBe('winchester');
    expect(result.label).toBe('Winchester');
  });

  it('falls through to planned for a slug not in config', () => {
    const result = resolveSignupTown('nowhereville', null);
    expect(result).toEqual({ kind: 'planned', town: null, label: 'your town' });
  });

  it('falls through to planned for free-text with the typed name as the label', () => {
    const result = resolveSignupTown(null, 'Bognor Regis');
    expect(result).toEqual({ kind: 'planned', town: null, label: 'Bognor Regis' });
  });

  it('falls back to a generic label when free text is empty', () => {
    const result = resolveSignupTown(null, '   ');
    expect(result.label).toBe('your town');
  });

  it('prefers the slug lookup over free text when both are present', () => {
    const result = resolveSignupTown('chichester', 'Ignored');
    expect(result.town?.slug).toBe('chichester');
  });
});
