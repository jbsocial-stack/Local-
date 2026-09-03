// R6: addresses are geocoded on save so the directory map (R8) can plot
// merchants without ops having to look up coordinates by hand. Uses
// Nominatim (OpenStreetMap), matching the stack's default map provider —
// no API key, but its usage policy requires a real identifying User-Agent
// and caps at ~1 request/second, which merchant settings saves are nowhere
// close to.
export interface GeocodeResult {
  lat: number;
  lng: number;
}

export class GeocodeNotFoundError extends Error {
  constructor(address: string) {
    super(`Could not find coordinates for "${address}"`);
    this.name = 'GeocodeNotFoundError';
  }
}

interface NominatimResponseRow {
  lat: string;
  lon: string;
}

/** Pure parse step, split out from the fetch call so it's unit-testable. */
export function parseNominatimResponse(address: string, rows: NominatimResponseRow[]): GeocodeResult {
  const first = rows[0];
  if (!first) throw new GeocodeNotFoundError(address);
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new GeocodeNotFoundError(address);
  return { lat, lng };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'LocalLoyaltyApp/1.0 (ops@local.app)' },
  });
  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }
  const rows = (await res.json()) as NominatimResponseRow[];
  return parseNominatimResponse(address, rows);
}
