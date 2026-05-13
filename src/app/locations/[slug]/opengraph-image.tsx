import { ImageResponse } from 'next/og';
import {
  getLocationBySlug,
  getLocationSummary,
  getYears,
} from '@/lib/supabase/queries';
import { loadOgFonts } from '@/lib/og/fonts';
import { publicPalette } from '@/lib/design/tokens';

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
  const [location, fonts] = await Promise.all([getLocationBySlug(slug), loadOgFonts()]);
  const hasFonts = fonts.length > 0;
  const headlineFont = hasFonts ? '"Newsreader"' : 'serif';
  const labelFont = hasFonts ? '"Bricolage Grotesque"' : 'sans-serif';

  if (!location) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Location not found</div>,
      { ...size, fonts: hasFonts ? fonts : undefined }
    );
  }

  const years = await getYears();
  const year = years[0];
  const summary = await getLocationSummary(slug, year);
  const stats = [
    { label: 'Participants', value: summary.total_participants },
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
          background: publicPalette.paper,
          color: publicPalette.ink,
          padding: '64px 72px',
          fontFamily: labelFont,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {location.logo_url ? (
            <img
              src={location.logo_url}
              alt=""
              width={56}
              height={56}
              style={{
                borderRadius: 12,
                objectFit: 'contain',
                background: publicPalette.card,
                padding: 4,
                border: `1px solid ${publicPalette.border}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: publicPalette.ink,
                color: publicPalette.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontFamily: headlineFont,
              }}
            >
              D
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 14,
                color: publicPalette.accent,
                textTransform: 'uppercase',
                letterSpacing: 2.5,
                fontWeight: 600,
              }}
            >
              {TYPE_LABEL[location.type] ?? 'Venue'}
              {location.region ? ` · ${location.region}` : ''}
            </span>
            <span
              style={{
                fontSize: 15,
                color: publicPalette.mutedForeground,
              }}
            >
              DPG Tracker · {year}
            </span>
          </div>
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
              fontFamily: headlineFont,
              color: publicPalette.ink,
            }}
          >
            {location.name}.
          </h1>
          {location.partner_type && (
            <p
              style={{
                fontSize: 22,
                marginTop: 18,
                color: publicPalette.foreground,
                fontFamily: headlineFont,
              }}
            >
              {location.partner_type}
            </p>
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
