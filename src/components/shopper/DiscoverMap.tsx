'use client';

import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { ShopListing } from '@/lib/directory/get-listings';

// Coral teardrop pin (matches the brand's coral, #F26B5B) instead of
// Leaflet's default blue marker — a plain divIcon so there's no external
// marker-icon.png dependency to theme.
function pinIcon(active: boolean) {
  const fill = active ? '#1C2B44' : '#F26B5B';
  return L.divIcon({
    className: '',
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="${fill}"/>
      <circle cx="16" cy="16" r="6.5" fill="#F4F2ED"/>
    </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

// Recenters when the filtered set changes (e.g. picking a category) rather
// than only on first mount, so the map still makes sense after filtering.
function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function DiscoverMap({
  listings,
  selectedId,
  onSelect,
}: {
  listings: ShopListing[];
  selectedId: string | null;
  onSelect: (shop: ShopListing) => void;
}) {
  if (listings.length === 0) return null;
  const center: [number, number] = [listings[0]!.lat, listings[0]!.lng];

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full"
    >
      {/* Default zoom control sits top-left, same corner as the category
          filter pills overlaid on the map — move it out of the way. */}
      <ZoomControl position="bottomright" />
      <RecenterOnChange center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((shop) => (
        <Marker
          key={shop.id}
          position={[shop.lat, shop.lng]}
          icon={pinIcon(shop.id === selectedId)}
          eventHandlers={{ click: () => onSelect(shop) }}
        />
      ))}
    </MapContainer>
  );
}
