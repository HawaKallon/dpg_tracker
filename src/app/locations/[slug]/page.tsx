import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, MapPin, GraduationCap, Users } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { SubProjectDonut } from '@/components/charts/sub-project-donut';
import { ActivityFeed } from '@/components/activity-feed';
import { RichText } from '@/components/editor/rich-text';
import { YearPicker } from '@/components/year-picker';
import {
  getLocationBySlug,
  getLocationSummary,
  getLocationMonthly,
  getLocationSubProjectMix,
  getActivitiesByLocation,
  getYears,
} from '@/lib/supabase/queries';

export const revalidate = 60;

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

export default async function LocationDetailPage({
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
    <>
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-primary-deep hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </nav>

        <header className="space-y-5">
          <div className="flex flex-wrap items-start gap-5">
            {location.logo_url && (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={location.logo_url}
                  alt={`${location.name} logo`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  <TypeIcon className="size-3" aria-hidden="true" />
                  {typeLabel}
                </Badge>
                {location.partner_type && (
                  <Badge variant="muted">{location.partner_type}</Badge>
                )}
                {location.region && (
                  <span className="text-xs text-muted-foreground">{location.region}</span>
                )}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-accent">
                {location.name}
              </h1>
              {location.website_url && (
                <a
                  href={location.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-deep hover:underline"
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
            <div className="rounded-xl border border-border bg-card p-6">
              <RichText json={location.description} />
            </div>
          )}
        </header>

        <section
          aria-label="Location metrics"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          <KpiCard
            label="Participants"
            value={summary.total_participants}
            hint={femaleHint}
          />
          <KpiCard
            label="Female"
            value={summary.total_female}
            forceRender={summary.total_participants > 0}
          />
          <KpiCard label="Activities" value={summary.activity_count} />
          <KpiCard label="Reach" value={summary.total_reach} hint="Discourse + comms" />
          <KpiCard label="Sub-projects" value={summary.sub_project_count} />
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <header className="mb-3">
              <h2 className="text-sm font-semibold text-accent">Activity over time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly participants and number of events in {currentYear}
              </p>
            </header>
            <MonthlyLine data={monthly} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <header className="mb-3">
              <h2 className="text-sm font-semibold text-accent">Program mix</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Participants by sub-project at this location
              </p>
            </header>
            <SubProjectDonut data={mix} />
          </div>
        </section>

        <section aria-label="Recent activities" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-accent">
              Recent activities
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest events at {location.name} in {currentYear}.
            </p>
          </div>
          <ActivityFeed items={recent} />
        </section>

        {gallery.length > 0 && (
          <section aria-label="Photos" className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-accent">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map(({ url, activityId }, i) => (
                <Link
                  key={url}
                  href={`/activities/${activityId}`}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted group"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform group-hover:scale-105"
                    loading={i < 4 ? 'eager' : 'lazy'}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
