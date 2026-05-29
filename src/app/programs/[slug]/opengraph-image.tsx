import { ImageResponse } from 'next/og';
import {
  getSubProjectBySlug,
  getSubProjectSummary,
  getYears,
} from '@/lib/supabase/queries';
import { loadOgFonts } from '@/lib/og/fonts';
import { publicPalette } from '@/lib/design/tokens';

export const alt = 'Program detail · DPG Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ProgramOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [sp, fonts] = await Promise.all([getSubProjectBySlug(slug), loadOgFonts()]);
  const hasFonts = fonts.length > 0;
  const headlineFont = hasFonts ? '"Newsreader"' : 'serif';
  const labelFont = hasFonts ? '"Bricolage Grotesque"' : 'sans-serif';

  if (!sp) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Program not found</div>,
      { ...size, fonts: hasFonts ? fonts : undefined }
    );
  }

  const years = await getYears();
  const year = years[0];
  const summary = await getSubProjectSummary(slug, year);
  const stats = [
    { label: 'Participants', value: summary.total_participants },
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
          background: publicPalette.paper,
          color: publicPalette.ink,
          padding: '64px 72px',
          fontFamily: labelFont,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              color: publicPalette.accent,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              fontWeight: 600,
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
              fontSize: 88,
              fontWeight: 500,
              lineHeight: 0.98,
              margin: 0,
              letterSpacing: '-0.025em',
              maxWidth: 1000,
              fontFamily: headlineFont,
              color: publicPalette.ink,
            }}
          >
            {sp.name}.
          </h1>
          {sp.funder_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
              {sp.funder_logo_url && (
                <img
                  src={sp.funder_logo_url}
                  alt=""
                  width={44}
                  height={44}
                  style={{
                    borderRadius: 8,
                    background: publicPalette.card,
                    padding: 4,
                    objectFit: 'contain',
                    border: `1px solid ${publicPalette.border}`,
                  }}
                />
              )}
              <span style={{ fontSize: 22, color: publicPalette.foreground }}>
                Supported by{' '}
                <strong style={{ color: publicPalette.ink, fontWeight: 600 }}>
                  {sp.funder_name}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            height: 2,
            width: 80,
            background: publicPalette.accent,
            marginBottom: 20,
          }}
        />

        <div style={{ display: 'flex', gap: 36 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 200,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: publicPalette.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: 46,
                  fontFamily: headlineFont,
                  color: publicPalette.ink,
                  lineHeight: 1,
                }}
              >
                {s.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: hasFonts ? fonts : undefined }
  );
}

function fallbackStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: publicPalette.paper,
    color: publicPalette.ink,
    fontSize: 48,
    fontFamily: 'serif',
  };
}
