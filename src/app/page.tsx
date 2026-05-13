import Link from 'next/link';
import { Download } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { KpiCard, type KpiDelta } from '@/components/kpi-card';
import { ProgramHero } from '@/components/program-hero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubProjectBar } from '@/components/charts/sub-project-bar';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { LocationsGrid } from '@/components/locations-grid';
import { ActivityFeed } from '@/components/activity-feed';
import { YearPicker } from '@/components/year-picker';
import { FilterBar } from '@/components/filter-bar';
import {
  getDashboardSummaryCompare,
  getBySubProject,
  getByMonth,
  getByLocation,
  getRecentActivities,
  getYears,
  getSubProjects,
  getLocations,
} from '@/lib/supabase/queries';

function delta(current: number, prior: number): KpiDelta | undefined {
  if (prior <= 0) return undefined;
  const pct = Math.round(((current - prior) / prior) * 100);
  return { pct, prior };
}

export const revalidate = 60;

type SearchParams = Promise<{
  year?: string;
  sub_project?: string;
  location?: string;
  date_from?: string;
  date_to?: string;
}>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const filters = {
    sub_project_id: sp.sub_project || null,
    location_id: sp.location || null,
    date_from: sp.date_from || null,
    date_to: sp.date_to || null,
  };

  const [summary, bySub, byMonth, byLoc, recent, subProjectOpts, locationOpts] =
    await Promise.all([
      getDashboardSummaryCompare(currentYear),
      getBySubProject(currentYear),
      getByMonth(currentYear),
      getByLocation(currentYear),
      getRecentActivities(currentYear, 24, filters),
      getSubProjects(),
      getLocations(),
    ]);

  const filtersActive = Boolean(
    filters.sub_project_id || filters.location_id || filters.date_from || filters.date_to
  );

  const universities = byLoc.filter((l) => l.type === 'university' && l.activity_count > 0);
  const otherVenues = byLoc.filter((l) => l.type !== 'university' && l.activity_count > 0);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;
  const femaleHint = summary.total_participants > 0 ? `${femalePct}% of total` : undefined;

  return (
    <>
      <SiteHeader />

      <ProgramHero
        currentYear={currentYear}
        controls={
          <>
            <YearPicker years={years} current={currentYear} />
            <Link href={`/api/export.csv?year=${currentYear}`}>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                Export CSV
              </Button>
            </Link>
          </>
        }
      />

      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        <section
          aria-label="Key program metrics"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <KpiCard
            label="Participants"
            value={summary.total_participants}
            delta={delta(summary.total_participants, summary.prior_participants)}
          />
          <KpiCard
            label="Male"
            value={summary.total_male}
            forceRender={summary.total_participants > 0}
            delta={delta(summary.total_male, summary.prior_male)}
          />
          <KpiCard
            label="Female"
            value={summary.total_female}
            hint={femaleHint}
            forceRender={summary.total_participants > 0}
            delta={delta(summary.total_female, summary.prior_female)}
          />
          <KpiCard
            label="Reach"
            value={summary.total_reach}
            hint="Discourse + comms"
            delta={delta(summary.total_reach, summary.prior_reach)}
          />
          <KpiCard
            label="Activities"
            value={summary.activity_count}
            delta={delta(summary.activity_count, summary.prior_activity_count)}
          />
          <KpiCard
            label="Locations"
            value={summary.location_count}
            delta={delta(summary.location_count, summary.prior_location_count)}
          />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants by sub-project</CardTitle>
              <CardDescription>Stacked by gender · {currentYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <SubProjectBar data={bySub} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity over time</CardTitle>
              <CardDescription>Monthly participants and number of events</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyLine data={byMonth} />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">Universities</h2>
              <p className="text-sm text-muted-foreground">
                All campuses with recorded participation in {currentYear}.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {universities.length} {universities.length === 1 ? 'campus' : 'campuses'}
            </span>
          </div>
          <LocationsGrid data={universities} />
        </section>

        {otherVenues.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">Hubs &amp; other venues</h2>
              <p className="text-sm text-muted-foreground">
                Innovation hubs, online forums, and other non-campus locations.
              </p>
            </div>
            <LocationsGrid data={otherVenues} />
          </section>
        )}

        <section aria-label="Recent activities" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">
                Recent activities
              </h2>
              <p className="text-sm text-muted-foreground">
                {filtersActive
                  ? `Showing filtered activities in ${currentYear}.`
                  : `Latest events logged in ${currentYear}.`}
              </p>
            </div>
            <FilterBar
              subProjects={subProjectOpts.map((s) => ({ id: s.id, name: s.name }))}
              locations={locationOpts.map((l) => ({ id: l.id, name: l.name }))}
              current={{
                sub_project: sp.sub_project,
                location: sp.location,
                date_from: sp.date_from,
                date_to: sp.date_to,
              }}
            />
          </div>
          <ActivityFeed items={recent} />
        </section>

        <footer className="pt-8 text-center text-xs text-muted-foreground">
          DPG Tracker · data refreshes within 60s of new entries.
        </footer>
      </main>
    </>
  );
}
