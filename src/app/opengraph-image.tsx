import { ImageResponse } from 'next/og';
import { getDashboardSummary, getYears } from '@/lib/supabase/queries';
import { programContent } from '@/content/program';

export const alt = 'DPG Tracker — Sierra Leone Digital Public Goods program';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const years = await getYears();
  const year = years[0];
  const summary = await getDashboardSummary(year);

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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 600 }}>DPG Tracker</span>
            <span style={{ fontSize: 16, opacity: 0.85 }}>
              {programContent.region} · {year}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {programContent.headline}
          </h1>
          <p style={{ fontSize: 22, lineHeight: 1.4, marginTop: 16, opacity: 0.9, maxWidth: 900 }}>
            {programContent.tagline}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
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
              <span style={{ fontSize: 14, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
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
