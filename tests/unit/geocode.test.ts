import { describe, expect, it } from 'vitest';
import { GeocodeNotFoundError, parseNominatimResponse } from '../../src/lib/geocode';

describe('parseNominatimResponse', () => {
  it('parses the first result', () => {
    const result = parseNominatimResponse('12 East Street, Chichester', [
      { lat: '50.8365', lon: '-0.7792' },
    ]);
    expect(result).toEqual({ lat: 50.8365, lng: -0.7792 });
  });

  it('throws GeocodeNotFoundError when there are no results', () => {
    expect(() => parseNominatimResponse('nowhere', [])).toThrow(GeocodeNotFoundError);
  });

  it('throws when a coordinate is not numeric', () => {
    expect(() =>
      parseNominatimResponse('bad data', [{ lat: 'not-a-number', lon: '-0.7792' }]),
    ).toThrow(GeocodeNotFoundError);
  });
});
