import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, ExternalLink, MapPin, GraduationCap, Users } from 'lucide-react';
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
  getLocationBySlug,
  getLocationSummary,
  getLocationMonthly,
  getLocationSubProjectMix,
  getActivitiesByLocation,
  getYears,
} from '@/lib/supabase/queries';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ year?: string }>;

const TYPE_ICON = {
  university: GraduationCap,
  hub: MapPin,
  online: Users,
  other: MapPin,
} as const;

const TYPE_LABEL = {
  university: 'University',
  hub: 'Hub',
  online: 'Online',
  other: 'Venue',
} as const;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) return { title: 'Location not found' };

  const description =
    location.partner_type
      ? `${TYPE_LABEL[location.type] ?? 'Venue'} · ${location.partner_type}${
          location.region ? ` · ${location.region}` : ''
        }`
      : `${TYPE_LABEL[location.type] ?? 'Venue'}${location.region ? ` · ${location.region}` : ''}`;

  return {
    title: location.name,
    description,
    openGraph: { title: location.name, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: location.name, description },
  };
}

export default function LocationDetailPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <LocationDetailContent {...props} />
      </Suspense>
    </SiteShell>
  );
}

async function LocationDetailContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const location = await getLocationBySlug(slug);
  if (!location) notFound();

  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const [summary, monthly, mix, recent] = await Promise.all([
    getLocationSummary(slug, currentYear),
    getLocationMonthly(slug, currentYear),
    getLocationSubProjectMix(slug, currentYear),
    getActivitiesByLocation(slug, currentYear, 12),
  ]);

  const femalePct =
    summary.total_participants > 0
      ? Math.round((summary.total_female / summary.total_participants) * 100)
      : 0;
  const femaleHint =
    summary.total_participants > 0 ? `${femalePct}% of total` : undefined;

  const TypeIcon = TYPE_ICON[location.type] ?? MapPin;
  const typeLabel = TYPE_LABEL[location.type] ?? 'Venue';

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
      <header className="space-y-6">
        <div className="flex flex-wrap items-start gap-5">
          {location.logo_url && (
            <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <Image
                src={location.logo_url}
                alt={`${location.name} logo`}
                fill
                sizes="96px"
                className="object-contain p-1.5"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-eyebrow text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-accent">
                <TypeIcon className="size-3" aria-hidden="true" />
                {typeLabel}
              </span>
              {location.partner_type && (
                <>
                  <span aria-hidden>·</span>
                  <span>{location.partner_type}</span>
                </>
              )}
              {location.region && (
                <>
                  <span aria-hidden>·</span>
                  <span>{location.region}</span>
                </>
              )}
            </div>
            <h1 className="text-display text-[clamp(2.25rem,6vw,4.5rem)] text-ink">
              {location.name}.
            </h1>
            {location.website_url && (
              <a
                href={location.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-deep"
              >
                {location.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
          <div className="shrink-0">
            <YearPicker years={years} current={currentYear} />
          </div>
        </div>
        {location.description && (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 max-w-3xl shadow-card">
            <RichText json={location.description} />
          </div>
        )}
      </header>
      </Reveal>

      {/* KPI strip ------------------------------------------------- */}
      <Reveal delay={0.05}>
      <section
        aria-label="Location metrics"
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
        <StatTile label="Sub-projects" value={summary.sub_project_count} forceRender />
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
              Monthly participants and events at {location.name}.
            </p>
          </header>
          <MonthlyLine data={monthly} />
        </div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-paper p-5 sm:p-6 shadow-card">
          <header className="mb-4">
            <SectionEyebrow tone="muted">Program mix</SectionEyebrow>
            <h2 className="font-serif text-2xl text-ink mt-2 leading-tight">
              Sub-projects run here
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Participants by sub-project.
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
            At {location.name}, in {currentYear}.
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
