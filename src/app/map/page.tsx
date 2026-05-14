import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { Reveal } from '@/components/public/reveal';
import { YearPicker } from '@/components/year-picker';
import { LocationsMap } from '@/components/map/locations-map';
import { PageSkeleton } from '@/components/page-skeleton';
import { getLocationsWithCoords, getYears } from '@/lib/supabase/queries';
import { publicMapColors } from '@/lib/design/tokens';

export const metadata: Metadata = {
  title: 'Map · DPG Tracker',
  description:
    'Where Sierra Leone’s Digital Public Goods program is active — every campus, hub, and venue with recorded participation, mapped.',
};

type SearchParams = Promise<{ year?: string }>;

const LEGEND: Array<{ label: string; color: string }> = [
  { label: 'Academic', color: publicMapColors.legend.university },
  { label: 'Community hub', color: publicMapColors.legend.hub },
  { label: 'Online', color: publicMapColors.legend.online },
  { label: 'Other', color: publicMapColors.legend.other },
];

export default function MapPage(props: { searchParams: SearchParams }) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<PageSkeleton />}>
        <MapContent {...props} />
      </Suspense>
    </>
  );
}

async function MapContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const points = await getLocationsWithCoords(currentYear);

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-8">
      <Reveal>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3 max-w-2xl">
          <SectionEyebrow tone="accent">Map</SectionEyebrow>
          <h1 className="text-display text-[clamp(2.25rem,5.5vw,4rem)] text-ink leading-[0.95]">
            Where we work
          </h1>
          <p className="font-serif text-lg text-foreground leading-snug">
            Every location with coordinates on file. Marker size grows with participant count. Color shows partner type.
          </p>
        </div>
        <YearPicker years={years} current={currentYear} />
      </section>
      </Reveal>

      {points.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 space-y-4 text-center max-w-2xl mx-auto">
          <p className="font-serif text-2xl text-ink leading-tight">No coordinates yet.</p>
          <p className="text-sm text-muted-foreground">
            None of the locations in the database have latitude / longitude set. Add coordinates in the admin to populate the map.
          </p>
        </div>
      ) : (
        <>
          <Reveal delay={0.05}>
          <LocationsMap points={points} />
          </Reveal>

          <Reveal delay={0.1}>
          <section
            aria-label="Map legend"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
          >
            <SectionEyebrow tone="muted">Partner type</SectionEyebrow>
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-2 text-foreground">
                <span
                  className="inline-block size-3 rounded-full border border-border"
                  style={{ backgroundColor: l.color }}
                  aria-hidden="true"
                />
                {l.label}
              </span>
            ))}
            <span className="ml-auto text-muted-foreground tabular-nums">
              {points.length} {points.length === 1 ? 'location' : 'locations'} · {currentYear}
            </span>
          </section>
          </Reveal>
        </>
      )}
    </main>
  );
}
