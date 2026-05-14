'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { publicMapColors } from '@/lib/design/tokens';

export default function CampusMapInner({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: '320px', width: '100%' }}
      className="rounded-2xl border border-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={12}
        pathOptions={{
          color: publicMapColors.markerStroke,
          fillColor: publicMapColors.marker,
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Popup>
          <div className="font-serif text-base leading-tight">{name}</div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
