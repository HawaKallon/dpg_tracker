import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Download, Sparkles } from 'lucide-react';
import { SiteShell } from '@/components/public/site-shell';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { StatTile } from '@/components/public/stat-tile';
import { PullQuote } from '@/components/public/pull-quote';
import { PartnerRow } from '@/components/public/partner-row';
import { Reveal } from '@/components/public/reveal';
import { KpiCard, type KpiDelta } from '@/components/kpi-card';
import { Button } from '@/components/ui/button';
import { SubProjectBar } from '@/components/charts/sub-project-bar';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { LocationsGrid } from '@/components/locations-grid';
import { ActivityFeed } from '@/components/activity-feed';
import { YearPicker } from '@/components/year-picker';
import { FilterBar } from '@/components/filter-bar';
import { PageSkeleton } from '@/components/page-skeleton';
import { RichText } from '@/components/editor/rich-text';
import { programContent } from '@/content/program';
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
    <SiteShell showBackground>
      <Suspense fallback={<PageSkeleton />}>
        <HomeContent {...props} />
      </Suspense>
    </SiteShell>
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

  const [
    summary,
    bySub,
    byMonth,
    byLoc,
    recent,
    subProjectOpts,
    locationOpts,
    partnersList,
    subProjects,
    stories,
  ] = await Promise.all([
    getDashboardSummaryCompare(currentYear),
    getBySubProject(currentYear),
    getByMonth(currentYear),
    getByLocation(currentYear),
    getRecentActivities(currentYear, 24, filters),
    getSubProjects(),
    getLocations(),
    getPartnersSummary(currentYear),
    getSubProjects(),
    getStorySpotlight(currentYear, 4),
  ]);

  const filtersActive = Boolean(
    filters.sub_project_id ||
      filters.location_id ||
      filters.month ||
      filters.q ||
      filters.partner
  );

  const universities = byLoc.filter((l) => l.type === 'university' && l.activity_count > 0);
  const otherVenues = byLoc.filter((l) => l.type !== 'university' && l.activity_count > 0);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;
  const femaleHint = summary.total_participants > 0 ? `${femalePct}% of total` : undefined;

  const storiesWithContent = stories.filter(
    (a) => (a.highlights && a.highlights.trim().length > 0) || (a.media_urls && a.media_urls.length > 0)
  );

  const programsWithStories = subProjects
    .filter((s) => s.is_active && s.description != null)
    .slice(0, 6);
  const showWhatWeDo = programsWithStories.length >= 2;

  const topRecent = recent[0];

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-14 sm:space-y-20">
      {/* Hero ------------------------------------------------------- */}
      <Reveal>
        <section
          aria-labelledby="hero-heading"
          className="relative rounded-3xl sm:rounded-[2rem] border border-border bg-paper p-5 sm:p-8 lg:p-12 overflow-hidden shadow-lift"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-6 min-w-0">
              <SectionEyebrow tone="accent">
                <Sparkles className="size-3" aria-hidden="true" />
                {programContent.eyebrow} · {currentYear}
              </SectionEyebrow>

              <h1
                id="hero-heading"
                className="text-display text-[clamp(2.5rem,7vw,5.25rem)] text-ink"
              >
                {programContent.headline}.
              </h1>

              <p className="font-serif text-lg sm:text-xl leading-snug text-foreground max-w-xl">
                {programContent.tagline}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <YearPicker years={years} current={currentYear} />
                <Link href={`/api/export.csv?year=${currentYear}`}>
                  <Button variant="primary" size="md" className="rounded-full">
                    <Download className="size-4" />
                    Export {currentYear} CSV
                  </Button>
                </Link>
                <Link href="/map">
                  <Button variant="outline" size="md" className="rounded-full">
                    See the map
                    <ArrowUpRight className="size-4" />
                  </Button>
                </Link>
              </div>

              <PartnerRow funders={programContent.funders} partners={programContent.partners} />
            </div>

            <div className="lg:col-span-5 relative min-w-0">
              <div
                aria-hidden
                className="absolute -right-4 -bottom-4 lg:-right-6 lg:-bottom-6 inset-0 rounded-3xl bg-muted/50 rotate-2 -z-10"
              />
              <Reveal direction="horizontal" reverse delay={0.15}>
                <CardCollage
                  participants={summary.total_participants}
                  priorParticipants={summary.prior_participants}
                  activityCount={summary.activity_count}
                  locationCount={summary.location_count}
                  topSub={bySub}
                  topActivity={topRecent}
                  currentYear={currentYear}
                />
              </Reveal>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Stat ribbon ------------------------------------------------ */}
      <Reveal delay={0.05}>
        <section
          aria-label="Key program metrics"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 rounded-3xl bg-paper shadow-card px-5 sm:px-8 py-8 sm:py-10"
        >
          <StatTile
            label="Participants"
            value={summary.total_participants}
            delta={delta(summary.total_participants, summary.prior_participants)}
            tone="primary"
          />
          <StatTile
            label="Male"
            value={summary.total_male}
            forceRender={summary.total_participants > 0}
            delta={delta(summary.total_male, summary.prior_male)}
          />
          <StatTile
            label="Female"
            value={summary.total_female}
            hint={femaleHint}
            forceRender={summary.total_participants > 0}
            delta={delta(summary.total_female, summary.prior_female)}
          />
          <StatTile
            label="Reach"
            value={summary.total_reach}
            hint="Discourse + comms"
            delta={delta(summary.total_reach, summary.prior_reach)}
          />
          <StatTile
            label="Activities"
            value={summary.activity_count}
            delta={delta(summary.activity_count, summary.prior_activity_count)}
          />
          <StatTile
            label="Locations"
            value={summary.location_count}
            delta={delta(summary.location_count, summary.prior_location_count)}
          />
        </section>
      </Reveal>

      {/* Mission --------------------------------------------------- */}
      <Reveal delay={0.05}>
        <section
          aria-labelledby="mission-heading"
          className="rounded-3xl bg-muted/40 px-5 sm:px-8 lg:px-10 py-10 sm:py-12 grid lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-4 space-y-3">
            <SectionEyebrow tone="accent">About the program</SectionEyebrow>
            <h2
              id="mission-heading"
              className="font-serif text-3xl sm:text-4xl leading-tight text-ink"
            >
              What we’re doing in Sierra Leone
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <p className="font-serif text-lg sm:text-xl leading-relaxed text-foreground">
              {programContent.mission}
            </p>
            <ul className="grid sm:grid-cols-3 gap-3">
              {programContent.whoWeServe.map((a) => (
                <li
                  key={a.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <p className="font-serif text-lg text-ink leading-snug">{a.label}.</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {a.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      {/* What we do — only if sub-projects have descriptions ------- */}
      {showWhatWeDo && (
        <Reveal delay={0.05}>
          <section aria-labelledby="what-we-do" className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <SectionEyebrow tone="accent">Programs</SectionEyebrow>
                <h2
                  id="what-we-do"
                  className="font-serif text-3xl sm:text-4xl text-ink mt-2 leading-tight"
                >
                  Our sub-projects
                </h2>
              </div>
              <Link
                href="/report"
                className="text-sm font-medium text-accent hover:text-accent-deep inline-flex items-center gap-1"
              >
                Read the annual report
                <ArrowUpRight className="size-4" />
              </Link>
            </header>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {programsWithStories.map((sp, i) => (
                <Reveal key={sp.id} delay={0.06 * i}>
                  <Link
                    href={`/programs/${sp.slug}`}
                    className="group block rounded-2xl border border-border bg-gradient-to-br from-card to-paper overflow-hidden shadow-card hover:shadow-lift hover:border-accent/60 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {sp.hero_image_url ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        <Image
                          src={sp.hero_image_url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] w-full bg-gradient-to-br from-paper to-muted" />
                    )}
                    <div className="p-5 sm:p-6 space-y-3">
                      {sp.funder_name && (
                        <SectionEyebrow tone="muted">Supported by {sp.funder_name}</SectionEyebrow>
                      )}
                      <h3 className="font-serif text-2xl leading-tight text-ink group-hover:text-accent transition-colors">
                        {sp.name}
                      </h3>
                      {sp.description && (
                        <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          <RichText
                            json={sp.description}
                            className="prose-p:text-sm prose-p:text-muted-foreground prose-p:font-sans prose-p:leading-relaxed"
                          />
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                        Read more <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Charts duo ------------------------------------------------- */}
      <Reveal delay={0.05}>
        <section aria-label="Activity charts" className="grid lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-paper p-5 sm:p-6 shadow-card">
            <header className="mb-5">
              <SectionEyebrow tone="muted">By sub-project</SectionEyebrow>
              <h2 className="font-serif text-2xl text-ink mt-2 leading-tight">
                Participants per sub-project
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Stacked by gender · {currentYear}
              </p>
            </header>
            <SubProjectBar data={bySub} />
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-paper p-5 sm:p-6 shadow-card">
            <header className="mb-5">
              <SectionEyebrow tone="muted">By month</SectionEyebrow>
              <h2 className="font-serif text-2xl text-ink mt-2 leading-tight">
                Activity through the year
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly participants and number of events.
              </p>
            </header>
            <MonthlyLine data={byMonth} />
          </div>
        </section>
      </Reveal>

      {/* Universities ---------------------------------------------- */}
      <Reveal delay={0.05}>
        <section aria-labelledby="universities-heading" className="space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionEyebrow tone="accent">Campuses</SectionEyebrow>
              <h2
                id="universities-heading"
                className="font-serif text-3xl sm:text-4xl text-ink mt-2 leading-tight"
              >
                Universities
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Every campus with recorded participation in {currentYear}.
              </p>
            </div>
            <span className="text-eyebrow text-muted-foreground">
              {universities.length} {universities.length === 1 ? 'campus' : 'campuses'}
            </span>
          </header>
          <LocationsGrid data={universities} />
        </section>
      </Reveal>

      {/* Hubs and other venues ------------------------------------- */}
      {otherVenues.length > 0 && (
        <Reveal delay={0.05}>
          <section aria-labelledby="hubs-heading" className="space-y-5">
            <header>
              <SectionEyebrow tone="accent">Non-campus</SectionEyebrow>
              <h2
                id="hubs-heading"
                className="font-serif text-3xl sm:text-4xl text-ink mt-2 leading-tight"
              >
                Hubs and other venues
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Innovation hubs, online forums, and anywhere else the work happens.
              </p>
            </header>
            <LocationsGrid data={otherVenues} />
          </section>
        </Reveal>
      )}

      {/* Stories from the field — hide if no content --------------- */}
      {storiesWithContent.length > 0 && (
        <Reveal delay={0.05}>
          <section
            aria-labelledby="stories-heading"
            className="rounded-3xl bg-muted/40 px-5 sm:px-8 lg:px-10 py-10 sm:py-12 space-y-6"
          >
            <header>
              <SectionEyebrow tone="accent">Stories</SectionEyebrow>
              <h2
                id="stories-heading"
                className="font-serif text-3xl sm:text-4xl text-ink mt-2 leading-tight"
              >
                Voices from the activities
              </h2>
            </header>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {storiesWithContent.map((s, i) => {
                const photo = s.media_urls?.[0];
                const title = s.sub_category?.name ?? s.category?.name ?? s.sub_project?.name ?? 'Activity';
                return (
                  <Reveal key={s.id} delay={0.06 * i}>
                    <Link
                      href={`/activities/${s.id}`}
                      className="group block rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-lift hover:border-accent/60 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {photo && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                          <Image
                            src={photo}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}
                      <div className="p-5 sm:p-7 space-y-4">
                        <SectionEyebrow tone="muted">
                          {s.sub_project?.name} · {s.location?.name ?? 'Sierra Leone'}
                        </SectionEyebrow>
                        {s.highlights && (
                          <PullQuote className="my-0">
                            “{s.highlights}”
                          </PullQuote>
                        )}
                        <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors inline-flex items-center gap-1">
                          {title} <ArrowUpRight className="size-3.5" />
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      {/* Recent activities + filter bar ---------------------------- */}
      <Reveal delay={0.05}>
        <section aria-labelledby="recent-heading" className="space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionEyebrow tone="accent">Activity log</SectionEyebrow>
              <h2
                id="recent-heading"
                className="font-serif text-3xl sm:text-4xl text-ink mt-2 leading-tight"
              >
                Recent activity
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filtersActive
                  ? `Filtered view of ${currentYear}.`
                  : `Events logged in ${currentYear}, newest first.`}
              </p>
            </div>
            <FilterBar
              subProjects={subProjectOpts.map((s) => ({ id: s.id, name: s.name }))}
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
          </header>
          <ActivityFeed items={recent} />
        </section>
      </Reveal>
    </main>
  );
}

function CardCollage({
  participants,
  priorParticipants,
  activityCount,
  locationCount,
  topSub,
  topActivity,
  currentYear,
}: {
  participants: number;
  priorParticipants: number;
  activityCount: number;
  locationCount: number;
  topSub: Awaited<ReturnType<typeof getBySubProject>>;
  topActivity: Awaited<ReturnType<typeof getRecentActivities>>[number] | undefined;
  currentYear: number;
}) {
  const topFive = topSub.slice(0, 5);
  const maxBar = Math.max(1, ...topFive.map((s) => s.total_participants));
  const participantsDelta = delta(participants, priorParticipants);

  return (
    <div className="relative w-full grid grid-cols-12 gap-2.5 min-w-0">
      <KpiCard
        label={`Participants · ${currentYear}`}
        value={participants}
        delta={participantsDelta}
        className="col-span-12 sm:col-span-7 lg:col-span-12 xl:col-span-7 bg-gradient-to-br from-primary to-primary-deep text-primary-foreground border-primary-deep shadow-anchor hover:!shadow-anchor hover:!translate-y-0 [&_*]:!text-primary-foreground"
      />

      <div className="col-span-12 sm:col-span-5 lg:col-span-12 xl:col-span-5 relative rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-3 justify-between shadow-card overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.5),transparent_60%)]"
        />
        <div className="relative">
          <SectionEyebrow tone="muted">At a glance</SectionEyebrow>
        </div>
        <div className="relative space-y-3">
          <div>
            <div className="font-serif text-3xl tabular-nums leading-none text-ink">
              {activityCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">activities</div>
          </div>
          <div>
            <div className="font-serif text-3xl tabular-nums leading-none text-ink">
              {locationCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">locations</div>
          </div>
        </div>
      </div>

      <div className="col-span-12 relative rounded-2xl border border-border bg-gradient-to-br from-paper to-card p-5 sm:p-6 shadow-card">
        <SectionEyebrow tone="muted">Top programs</SectionEyebrow>
        <ul className="mt-4 space-y-3">
          {topFive.length === 0 && (
            <li className="text-sm text-muted-foreground">No programs recorded yet.</li>
          )}
          {topFive.map((s) => {
            const pct = (s.total_participants / maxBar) * 100;
            return (
              <li key={s.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink truncate">{s.name}</span>
                  <span className="font-serif text-lg tabular-nums text-ink shrink-0">
                    {s.total_participants.toLocaleString()}
                  </span>
                </div>
                <div className="h-px w-full bg-border relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 h-px bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {topActivity && (
        <Link
          href={`/activities/${topActivity.id}`}
          className="col-span-12 group rounded-2xl border border-accent/30 bg-card p-5 sm:p-6 shadow-terracotta hover:shadow-lift hover:-translate-y-0.5 hover:border-accent/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SectionEyebrow tone="accent">Most recent</SectionEyebrow>
          <p className="font-serif text-xl leading-snug text-ink mt-3 group-hover:text-accent transition-colors">
            {topActivity.sub_category?.name ?? topActivity.category?.name ?? topActivity.sub_project?.name ?? 'Activity'}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground truncate">
              {topActivity.location?.name ?? 'Sierra Leone'}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-accent shrink-0">
              See it <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
