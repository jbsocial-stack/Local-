'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ShopListing } from '@/lib/directory/get-listings';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function DiscoverMap({ listings, town }: { listings: ShopListing[]; town: string }) {
  if (listings.length === 0) return null;
  const center: [number, number] = [listings[0]!.lat, listings[0]!.lng];

  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-64 w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((shop) => (
        <Marker key={shop.id} position={[shop.lat, shop.lng]} icon={icon}>
          <Popup>
            <a href={`/${town}/app/discover/${shop.slug}`}>
              <strong>{shop.name}</strong>
            </a>
            <br />
            {shop.category} · {shop.activeMultiplier}x
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
