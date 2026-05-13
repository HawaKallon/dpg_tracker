import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SiteShell } from '@/components/public/site-shell';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { StatTile } from '@/components/public/stat-tile';
import { Reveal } from '@/components/public/reveal';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { SubProjectDonut } from '@/components/charts/sub-project-donut';
import { ActivityFeed } from '@/components/activity-feed';
import { RichText } from '@/components/editor/rich-text';
import { YearPicker } from '@/components/year-picker';
import { PageSkeleton } from '@/components/page-skeleton';
import {
  getSubProjectBySlug,
  getSubProjectSummary,
  getSubProjectMonthly,
  getSubProjectLocationMix,
  getActivitiesBySubProject,
  getYears,
} from '@/lib/supabase/queries';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ year?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await getSubProjectBySlug(slug);
  if (!sp) return { title: 'Program not found' };
  const description = sp.funder_name
    ? `Program · supported by ${sp.funder_name}`
    : 'Program — Sierra Leone Digital Public Goods';
  return {
    title: sp.name,
    description,
    openGraph: { title: sp.name, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: sp.name, description },
  };
}

export default function SubProjectDetailPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <SubProjectDetailContent {...props} />
      </Suspense>
    </SiteShell>
  );
}

async function SubProjectDetailContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const subProject = await getSubProjectBySlug(slug);
  if (!subProject) notFound();

  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const [summary, monthly, mix, recent] = await Promise.all([
    getSubProjectSummary(slug, currentYear),
    getSubProjectMonthly(slug, currentYear),
    getSubProjectLocationMix(slug, currentYear),
    getActivitiesBySubProject(slug, currentYear, 12),
  ]);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;
  const femaleHint =
    summary.total_participants > 0 ? `${femalePct}% of total` : undefined;

  const gallery = recent
    .flatMap((a) => a.media_urls.map((url) => ({ url, activityId: a.id })))
    .slice(0, 9);

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-12 sm:space-y-16">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </nav>

      {/* Hero ------------------------------------------------------- */}
      <Reveal>
      <header className="space-y-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <SectionEyebrow tone="accent">Program</SectionEyebrow>
              {!subProject.is_active && (
                <span className="text-eyebrow text-muted-foreground">Archived</span>
              )}
            </div>
            <h1 className="text-display text-[clamp(2.25rem,6vw,4.5rem)] text-ink">
              {subProject.name}.
            </h1>
            {subProject.funder_name && (
              <div className="flex items-center gap-3">
                {subProject.funder_logo_url && (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                    <Image
                      src={subProject.funder_logo_url}
                      alt={`${subProject.funder_name} logo`}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  Supported by{' '}
                  <strong className="text-ink font-semibold">{subProject.funder_name}</strong>
                </span>
              </div>
            )}
            <div className="pt-2">
              <YearPicker years={years} current={currentYear} />
            </div>
          </div>
          {subProject.hero_image_url && (
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-lift">
                <Image
                  src={subProject.hero_image_url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {subProject.description && (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 max-w-3xl shadow-card">
            <RichText json={subProject.description} />
          </div>
        )}
      </header>
      </Reveal>

      {/* KPI strip ------------------------------------------------- */}
      <Reveal delay={0.05}>
      <section
        aria-label="Program metrics"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 rounded-3xl bg-paper shadow-card px-5 sm:px-8 py-8"
      >
        <StatTile
          label="Participants"
          value={summary.total_participants}
          hint={femaleHint}
          tone="primary"
          forceRender
        />
        <StatTile
          label="Female"
          value={summary.total_female}
          forceRender={summary.total_participants > 0}
        />
        <StatTile label="Activities" value={summary.activity_count} forceRender />
        <StatTile
          label="Reach"
          value={summary.total_reach}
          hint="Discourse + comms"
          forceRender={summary.total_reach > 0}
        />
        <StatTile label="Locations" value={summary.location_count} forceRender />
      </section>
      </Reveal>

      {/* Charts ---------------------------------------------------- */}
      <Reveal delay={0.05}>
      <section className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-card to-paper p-5 sm:p-6 shadow-card">
          <header className="mb-4">
            <SectionEyebrow tone="muted">By month</SectionEyebrow>
            <h2 className="font-serif text-2xl text-ink mt-2 leading-tight">
              Activity in {currentYear}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly participants and number of events.
            </p>
          </header>
          <MonthlyLine data={monthly} />
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-paper p-5 sm:p-6 shadow-card">
          <header className="mb-4">
            <SectionEyebrow tone="muted">By location</SectionEyebrow>
            <h2 className="font-serif text-2xl text-ink mt-2 leading-tight">
              Participants per location
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Where this sub-project ran.
            </p>
          </header>
          <SubProjectDonut data={mix} />
        </div>
      </section>
      </Reveal>

      {/* Recent activities ----------------------------------------- */}
      <Reveal delay={0.05}>
      <section aria-labelledby="recent-heading" className="space-y-5">
        <header>
          <SectionEyebrow tone="accent">Activity log</SectionEyebrow>
          <h2 id="recent-heading" className="font-serif text-3xl text-ink mt-2 leading-tight">
            Latest events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            From {subProject.name}, in {currentYear}.
          </p>
        </header>
        <ActivityFeed items={recent} />
      </section>
      </Reveal>

      {/* Gallery --------------------------------------------------- */}
      {gallery.length > 0 && (
        <Reveal delay={0.05}>
        <section aria-labelledby="gallery-heading" className="space-y-5">
          <header>
            <SectionEyebrow tone="accent">Photos</SectionEyebrow>
            <h2 id="gallery-heading" className="font-serif text-3xl text-ink mt-2 leading-tight">
              From recent activities
            </h2>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {gallery.map(({ url, activityId }, i) => (
              <Link
                key={url}
                href={`/activities/${activityId}`}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-card hover:shadow-lift transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
                <span className="absolute right-3 top-3 inline-flex items-center justify-center size-7 rounded-full bg-paper text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
        </Reveal>
      )}
    </main>
  );
}
