import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Download } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { KpiCard, type KpiDelta } from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubProjectBar } from '@/components/charts/sub-project-bar';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { LocationsGrid } from '@/components/locations-grid';
import { ActivityFeed } from '@/components/activity-feed';
import { YearPicker } from '@/components/year-picker';
import { FilterBar } from '@/components/filter-bar';
import { PageSkeleton } from '@/components/page-skeleton';
import { RichText } from '@/components/editor/rich-text';
import {
  getDashboardSummaryCompare,
  getBySubProject,
  getByMonth,
  getByLocation,
  getRecentActivities,
  getYears,
  getSubProjects,
  getLocations,
  getPartnersSummary,
  getStorySpotlight,
} from '@/lib/supabase/queries';

function delta(current: number, prior: number): KpiDelta | undefined {
  if (prior <= 0) return undefined;
  const pct = Math.round(((current - prior) / prior) * 100);
  return { pct, prior };
}

type SearchParams = Promise<{
  year?: string;
  sub_project?: string;
  location?: string;
  month?: string;
  q?: string;
  partner?: string;
}>;

export default function HomePage(props: { searchParams: SearchParams }) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<PageSkeleton />}>
        <HomeContent {...props} />
      </Suspense>
    </>
  );
}

async function HomeContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const monthNum = sp.month ? Number(sp.month) : null;
  const filters = {
    sub_project_id: sp.sub_project || null,
    location_id: sp.location || null,
    month: monthNum && monthNum >= 1 && monthNum <= 12 ? monthNum : null,
    q: sp.q || null,
    partner: sp.partner || null,
  };

  const [summary, bySub, byMonth, byLoc, recent, subProjects, locationOpts, partnersList, stories] =
    await Promise.all([
      getDashboardSummaryCompare(currentYear),
      getBySubProject(currentYear),
      getByMonth(currentYear),
      getByLocation(currentYear),
      getRecentActivities(currentYear, 24, filters),
      getSubProjects(),
      getLocations(),
      getPartnersSummary(currentYear),
      getStorySpotlight(currentYear, 4),
    ]);

  const universities = byLoc.filter((l) => l.type === 'university' && l.activity_count > 0);
  const otherVenues = byLoc.filter((l) => l.type !== 'university' && l.activity_count > 0);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;

  const programsWithDescriptions = subProjects
    .filter((s) => s.is_active && s.description != null)
    .slice(0, 6);
  const showProgramsSection = programsWithDescriptions.length >= 2;

  const storiesWithContent = stories.filter(
    (a) =>
      (a.highlights && a.highlights.trim().length > 0) ||
      (a.media_urls && a.media_urls.length > 0),
  );

  const filtersActive = Boolean(
    filters.sub_project_id ||
      filters.location_id ||
      filters.month ||
      filters.q ||
      filters.partner,
  );

  return (
    <>
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
        {/* KPI grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Participants"
            value={summary.total_participants}
            delta={delta(summary.total_participants, summary.prior_participants)}
          />
          <KpiCard
            label="Male"
            value={summary.total_male}
            delta={delta(summary.total_male, summary.prior_male)}
          />
          <KpiCard
            label="Female"
            value={summary.total_female}
            hint={summary.total_participants > 0 ? `${femalePct}% of total` : undefined}
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

        {/* Charts */}
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

        {/* Sub-projects */}
        {showProgramsSection && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-accent">Our programs</h2>
                <p className="text-sm text-muted-foreground">
                  Active sub-projects running in {currentYear}.
                </p>
              </div>
              <Link
                href="/report"
                className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                Annual report →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {programsWithDescriptions.map((prog) => (
                <Link
                  key={prog.id}
                  href={`/programs/${prog.slug}`}
                  className="group block rounded-xl border border-border bg-card hover:border-accent/60 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent overflow-hidden"
                >
                  {prog.hero_image_url && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      <Image
                        src={prog.hero_image_url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-1">
                    {prog.funder_name && (
                      <p className="text-xs text-muted-foreground">{prog.funder_name}</p>
                    )}
                    <h3 className="font-semibold text-accent group-hover:text-primary-deep transition-colors leading-snug">
                      {prog.name}
                    </h3>
                    {prog.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <RichText
                          json={prog.description}
                          className="prose-p:text-sm prose-p:text-muted-foreground prose-p:font-sans"
                        />
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-2">
                      Read more <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Universities */}
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
          <LocationsGrid data={universities} year={currentYear} />
        </section>

        {/* Hubs & other venues */}
        {otherVenues.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">
                Hubs &amp; other venues
              </h2>
              <p className="text-sm text-muted-foreground">
                Innovation hubs, online forums, and other non-campus locations.
              </p>
            </div>
            <LocationsGrid data={otherVenues} year={currentYear} />
          </section>
        )}

        {/* Stories */}
        {storiesWithContent.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">
                Stories from the field
              </h2>
              <p className="text-sm text-muted-foreground">
                Activities with photos and highlights from {currentYear}.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {storiesWithContent.map((s) => {
                const photo = s.media_urls?.[0];
                const title =
                  s.sub_category?.name ??
                  s.category?.name ??
                  s.sub_project?.name ??
                  'Activity';
                return (
                  <Link
                    key={s.id}
                    href={`/activities/${s.id}`}
                    className="group block rounded-xl border border-border bg-card hover:border-accent/60 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent overflow-hidden"
                  >
                    {photo && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                        <Image
                          src={photo}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {s.sub_project?.name}
                        {s.location?.name ? ` · ${s.location.name}` : ''}
                      </p>
                      {s.highlights && (
                        <blockquote className="text-sm text-foreground italic border-l-2 border-primary pl-3 leading-relaxed">
                          &ldquo;{s.highlights}&rdquo;
                        </blockquote>
                      )}
                      <p className="text-xs font-medium text-accent group-hover:text-primary-deep transition-colors">
                        {title} →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent activities */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-accent">
                Recent activities
              </h2>
              <p className="text-sm text-muted-foreground">
                {filtersActive
                  ? `Filtered view of ${currentYear}.`
                  : `Latest events logged in ${currentYear}.`}
              </p>
            </div>
            <FilterBar
              subProjects={subProjects.map((s) => ({ id: s.id, name: s.name }))}
              locations={locationOpts.map((l) => ({ id: l.id, name: l.name }))}
              partners={partnersList.map((p) => p.partner)}
              current={{
                sub_project: sp.sub_project,
                location: sp.location,
                month: sp.month,
                q: sp.q,
                partner: sp.partner,
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
