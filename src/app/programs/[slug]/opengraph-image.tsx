import { ImageResponse } from 'next/og';
import {
  getSubProjectBySlug,
  getSubProjectSummary,
  getYears,
} from '@/lib/supabase/queries';

export const alt = 'Program detail · DPG Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ProgramOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const sp = await getSubProjectBySlug(slug);
  if (!sp) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Program not found</div>,
      { ...size }
    );
  }

  const years = await getYears();
  const year = years[0];
  const summary = await getSubProjectSummary(slug, year);
  const stats = [
    { label: 'Participants', value: summary.total_participants },
    { label: 'Reach', value: summary.total_reach },
    { label: 'Activities', value: summary.activity_count },
    { label: 'Locations', value: summary.location_count },
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
          <span
            style={{
              fontSize: 14,
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: 2,
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            Program · {year}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: '-0.02em',
              maxWidth: 1000,
            }}
          >
            {sp.name}
          </h1>
          {sp.funder_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
              {sp.funder_logo_url && (
                <img
                  src={sp.funder_logo_url}
                  alt=""
                  width={48}
                  height={48}
                  style={{ borderRadius: 8, background: 'white', padding: 4, objectFit: 'contain' }}
                />
              )}
              <span style={{ fontSize: 22, opacity: 0.9 }}>
                Supported by <strong>{sp.funder_name}</strong>
              </span>
            </div>
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
