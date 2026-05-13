import { ImageResponse } from 'next/og';
import { getActivityById } from '@/lib/supabase/queries';

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
  const activity = await getActivityById(id);
  if (!activity) {
    return new ImageResponse(
      <div style={fallbackStyle()}>Activity not found</div>,
      { ...size }
    );
  }

  const title =
    activity.sub_category?.name ??
    activity.category?.name ??
    activity.sub_project?.name ??
    'Activity';
  const total = activity.total_count ?? (activity.male_count ?? 0) + (activity.female_count ?? 0);
  const hero = activity.media_urls[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0b3b5e',
          color: 'white',
          fontFamily: 'sans-serif',
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
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(11,59,94,0.92) 0%, rgba(11,59,94,0.6) 60%, rgba(11,59,94,0.95) 100%)',
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
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: 2,
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
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: '-0.02em',
                maxWidth: 1000,
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 22, marginTop: 16, opacity: 0.9 }}>
              {[activity.location?.name, formatDate(activity.activity_date, activity.month_label)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {total > 0 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span style={{ fontSize: 60, fontWeight: 800 }}>
                {total.toLocaleString()}
              </span>
              <span style={{ fontSize: 22, opacity: 0.85 }}>participants</span>
            </div>
          )}
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
