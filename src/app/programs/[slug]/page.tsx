import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { MonthlyLine } from '@/components/charts/monthly-line';
import { SubProjectDonut } from '@/components/charts/sub-project-donut';
import { ActivityFeed } from '@/components/activity-feed';
import { RichText } from '@/components/editor/rich-text';
import { YearPicker } from '@/components/year-picker';
import {
  getSubProjectBySlug,
  getSubProjectSummary,
  getSubProjectMonthly,
  getSubProjectLocationMix,
  getActivitiesBySubProject,
  getYears,
} from '@/lib/supabase/queries';

export const revalidate = 60;

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

export default async function SubProjectDetailPage({
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
          {subProject.hero_image_url && (
            <div className="relative h-40 sm:h-56 w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={subProject.hero_image_url}
                alt=""
                fill
                sizes="(min-width: 1280px) 1100px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Program</Badge>
                {!subProject.is_active && (
                  <span className="text-xs text-muted-foreground">Archived</span>
                )}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-accent">
                {subProject.name}
              </h1>
              {subProject.funder_name && (
                <div className="flex items-center gap-3">
                  {subProject.funder_logo_url && (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border bg-white">
                      <Image
                        src={subProject.funder_logo_url}
                        alt={`${subProject.funder_name} logo`}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Supported by{' '}
                    <strong className="text-accent">{subProject.funder_name}</strong>
                  </span>
                </div>
              )}
            </div>
            <div className="shrink-0">
              <YearPicker years={years} current={currentYear} />
            </div>
          </div>
          {subProject.description && (
            <div className="rounded-xl border border-border bg-card p-6">
              <RichText json={subProject.description} />
            </div>
          )}
        </header>

        <section
          aria-label="Program metrics"
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
          <KpiCard label="Locations" value={summary.location_count} />
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
              <h2 className="text-sm font-semibold text-accent">Where it ran</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Participants by location
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
              Latest events in {currentYear} from {subProject.name}.
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
