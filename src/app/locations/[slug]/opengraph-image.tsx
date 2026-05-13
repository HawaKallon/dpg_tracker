import { ImageResponse } from 'next/og';
import {
  getLocationBySlug,
  getLocationSummary,
  getYears,
} from '@/lib/supabase/queries';

export const alt = 'Location detail · DPG Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TYPE_LABEL: Record<string, string> = {
  university: 'University',
  hub: 'Innovation hub',
  online: 'Online forum',
  other: 'Venue',
};

export default async function LocationOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const location = await getLocationBySlug(slug);
  if (!location) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Location not found</div>,
      { ...size }
    );
  }

  const years = await getYears();
  const year = years[0];
  const summary = await getLocationSummary(slug, year);
  const stats = [
    { label: 'Participants', value: summary.total_participants },
    { label: 'Reach', value: summary.total_reach },
    { label: 'Activities', value: summary.activity_count },
    { label: 'Sub-projects', value: summary.sub_project_count },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0b3b5e 0%, #1CABE2 100%)',
          color: 'white',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {location.logo_url ? (
            <img
              src={location.logo_url}
              alt=""
              width={64}
              height={64}
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'white',
                color: '#0b3b5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              D
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 20, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
              {TYPE_LABEL[location.type] ?? 'Venue'}
              {location.region ? ` · ${location.region}` : ''}
            </span>
            <span style={{ fontSize: 16, opacity: 0.75 }}>DPG Tracker · {year}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {location.name}
          </h1>
          {location.partner_type && (
            <p style={{ fontSize: 22, marginTop: 16, opacity: 0.9 }}>
              {location.partner_type}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 20px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.12)',
                minWidth: 160,
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.label}
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, marginTop: 6 }}>
                {s.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

function fallbackStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b3b5e',
    color: 'white',
    fontSize: 48,
    fontFamily: 'sans-serif',
  };
}
