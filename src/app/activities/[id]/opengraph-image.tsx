import { ImageResponse } from 'next/og';
import { getActivityById } from '@/lib/supabase/queries';
import { loadOgFonts } from '@/lib/og/fonts';
import { publicPalette } from '@/lib/design/tokens';

export const alt = 'Activity · DPG Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function formatDate(s: string | null, fallback: string | null): string {
  if (!s) return fallback ?? '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ActivityOgImage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [activity, fonts] = await Promise.all([getActivityById(id), loadOgFonts()]);
  const hasFonts = fonts.length > 0;
  const headlineFont = hasFonts ? '"Newsreader"' : 'serif';
  const labelFont = hasFonts ? '"Bricolage Grotesque"' : 'sans-serif';

  if (!activity) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Activity not found</div>,
      { ...size, fonts: hasFonts ? fonts : undefined }
    );
  }

  const title =
    activity.sub_category?.name ??
    activity.category?.name ??
    activity.sub_project?.name ??
    'Activity';
  const total =
    activity.total_count ?? (activity.male_count ?? 0) + (activity.female_count ?? 0);
  const hero = activity.media_urls[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: publicPalette.paper,
          color: publicPalette.ink,
          fontFamily: labelFont,
          position: 'relative',
        }}
      >
        {hero ? (
          <>
            <img
              src={hero}
              alt=""
              width={size.width}
              height={size.height}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.35,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(110deg, ${publicPalette.paper} 0%, rgba(244,239,229,0.94) 45%, rgba(244,239,229,0.7) 100%)`,
              }}
            />
          </>
        ) : null}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            padding: '64px 72px',
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: publicPalette.accent,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              fontWeight: 600,
            }}
          >
            {activity.sub_project?.name ?? 'Activity'} · {activity.event_year}
          </span>
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
                fontSize: 80,
                fontWeight: 500,
                lineHeight: 0.98,
                margin: 0,
                letterSpacing: '-0.025em',
                maxWidth: 1000,
                fontFamily: headlineFont,
                color: publicPalette.ink,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 22,
                marginTop: 18,
                color: publicPalette.mutedForeground,
                fontFamily: headlineFont,
              }}
            >
              {[
                activity.location?.name,
                formatDate(activity.activity_date, activity.month_label),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div
            style={{
              height: 2,
              width: 80,
              background: publicPalette.accent,
              marginBottom: 18,
            }}
          />
          {total > 0 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: 78,
                  fontFamily: headlineFont,
                  color: publicPalette.ink,
                  lineHeight: 1,
                }}
              >
                {total.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: publicPalette.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontWeight: 600,
                }}
              >
                participants
              </span>
            </div>
          )}
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
