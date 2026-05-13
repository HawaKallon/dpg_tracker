import { ImageResponse } from 'next/og';
import { getDashboardSummary, getYears } from '@/lib/supabase/queries';
import { programContent } from '@/content/program';
import { loadOgFonts } from '@/lib/og/fonts';
import { publicPalette } from '@/lib/design/tokens';

export const alt = 'DPG Tracker — Sierra Leone Digital Public Goods program';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const [years, fonts] = await Promise.all([getYears(), loadOgFonts()]);
  const year = years[0];
  const summary = await getDashboardSummary(year);

  const hasFonts = fonts.length > 0;
  const headlineFont = hasFonts ? '"Newsreader"' : 'serif';
  const labelFont = hasFonts ? '"Bricolage Grotesque"' : 'sans-serif';

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
          background: publicPalette.paper,
          color: publicPalette.ink,
          padding: '64px 72px',
          fontFamily: labelFont,
          position: 'relative',
        }}
      >
        {/* Eyebrow row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: publicPalette.ink,
              color: publicPalette.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontFamily: headlineFont,
            }}
          >
            D
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: publicPalette.ink,
              }}
            >
              DPG Tracker
            </span>
            <span
              style={{
                fontSize: 14,
                color: publicPalette.mutedForeground,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {programContent.region} · {year}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontSize: 108,
              fontWeight: 500,
              lineHeight: 0.96,
              letterSpacing: '-0.025em',
              margin: 0,
              fontFamily: headlineFont,
              color: publicPalette.ink,
              maxWidth: 1000,
            }}
          >
            {programContent.headline}.
          </h1>
          <p
            style={{
              fontSize: 24,
              lineHeight: 1.35,
              marginTop: 22,
              color: publicPalette.foreground,
              fontFamily: headlineFont,
              maxWidth: 950,
            }}
          >
            Every workshop, every campus, every line of open code shipped.
          </p>
        </div>

        {/* Terracotta divider */}
        <div
          style={{
            height: 2,
            width: 80,
            background: publicPalette.accent,
            marginBottom: 24,
          }}
        />

        {/* Stat tiles */}
        <div style={{ display: 'flex', gap: 28 }}>
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
                  letterSpacing: 2,
                  textTransform: 'uppercase',
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
