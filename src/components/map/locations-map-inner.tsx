'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LocationMapPoint } from '@/lib/supabase/query-types';
import { publicMapColors } from '@/lib/design/tokens';

const SIERRA_LEONE_CENTER: [number, number] = [8.4606, -11.7799];

const PARTNER_COLORS: Record<string, string> = {
  academic: publicMapColors.legend.university,
  university: publicMapColors.legend.university,
  'community-hub': publicMapColors.legend.hub,
  hub: publicMapColors.legend.hub,
  online: publicMapColors.legend.online,
  gov: publicMapColors.legend.other,
};

const DEFAULT_COLOR = publicMapColors.marker;

function radiusFor(participants: number): number {
  if (participants <= 0) return 5;
  const r = Math.sqrt(participants) * 0.9;
  return Math.min(28, Math.max(5, r));
}

function colorFor(partnerType: string | null, type: string): string {
  if (partnerType && PARTNER_COLORS[partnerType]) return PARTNER_COLORS[partnerType];
  if (PARTNER_COLORS[type]) return PARTNER_COLORS[type];
  return DEFAULT_COLOR;
}

export default function LocationsMapInner({ points }: { points: LocationMapPoint[] }) {
  return (
    <MapContainer
      center={SIERRA_LEONE_CENTER}
      zoom={7}
      scrollWheelZoom={false}
      style={{ height: '600px', width: '100%' }}
      className="rounded-3xl border border-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      {points.map((p) => {
        const color = colorFor(p.partner_type, p.type);
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={radiusFor(p.total_participants)}
            pathOptions={{
              color: publicMapColors.markerStroke,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <div className="font-serif text-lg leading-tight">{p.name}</div>
                <div className="text-xs space-y-0.5">
                  <div>
                    <strong>{p.total_participants.toLocaleString()}</strong> participants
                  </div>
                  <div>
                    {p.activity_count} {p.activity_count === 1 ? 'activity' : 'activities'}
                  </div>
                  {p.partner_type && <div className="capitalize opacity-70">{p.partner_type}</div>}
                </div>
                <a
                  href={`/locations/${p.slug}`}
                  className="block text-xs font-semibold"
                  style={{ color: publicMapColors.marker }}
                >
                  View page →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
