import Link from 'next/link';
import { Download } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubProjectBar } from '@/components/charts/sub-project-bar';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { LocationsGrid } from '@/components/locations-grid';
import { ActivityFeed } from '@/components/activity-feed';
import { YearPicker } from '@/components/year-picker';
import {
  getDashboardSummary,
  getBySubProject,
  getByMonth,
  getByLocation,
  getRecentActivities,
  getYears,
} from '@/lib/supabase/queries';

export const revalidate = 60;

type SearchParams = Promise<{ year?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const [summary, bySub, byMonth, byLoc, recent] = await Promise.all([
    getDashboardSummary(currentYear),
    getBySubProject(currentYear),
    getByMonth(currentYear),
    getByLocation(currentYear),
    getRecentActivities(currentYear, 12),
  ]);

  const universities = byLoc.filter((l) => l.type === 'university' && l.activity_count > 0);
  const otherVenues = byLoc.filter((l) => l.type !== 'university' && l.activity_count > 0);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;

  return (
    <>
      <SiteHeader />

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-deep font-medium">
              Sierra Leone · {currentYear}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-accent mt-1">
              DPG by the Numbers
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Live tracker of the Digital Public Goods program — participation, reach, and
              engagement across universities, hubs, and online communities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <YearPicker years={years} current={currentYear} />
            <Link href={`/api/export.csv?year=${currentYear}`}>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                Export CSV
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Participants" value={summary.total_participants} />
          <KpiCard label="Male" value={summary.total_male} />
          <KpiCard label="Female" value={summary.total_female} hint={`${femalePct}% of total`} />
          <KpiCard label="Reach" value={summary.total_reach} hint="Discourse + comms" />
          <KpiCard label="Activities" value={summary.activity_count} />
          <KpiCard label="Locations" value={summary.location_count} />
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

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-accent">Recent activities</h2>
            <p className="text-sm text-muted-foreground">
              Latest events logged in {currentYear}.
            </p>
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
