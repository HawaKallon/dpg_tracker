import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { SiteShell } from '@/components/public/site-shell';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { StatTile } from '@/components/public/stat-tile';
import { PullQuote } from '@/components/public/pull-quote';
import { Reveal } from '@/components/public/reveal';
import { RichText } from '@/components/editor/rich-text';
import { PageSkeleton } from '@/components/page-skeleton';
import { getActivityById } from '@/lib/supabase/queries';

type Params = Promise<{ id: string }>;

function formatDate(s: string | null, fallback: string | null): string {
  if (!s) return fallback ?? '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function activityTitle(a: {
  sub_category: { name: string } | null;
  category: { name: string } | null;
  sub_project: { name: string } | null;
}) {
  return a.sub_category?.name ?? a.category?.name ?? a.sub_project?.name ?? 'Activity';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const activity = await getActivityById(id);
  if (!activity) return { title: 'Activity not found' };

  const title = activityTitle(activity);
  const where = activity.location?.name ?? 'Sierra Leone';
  const description = `${title} · ${where} · ${activity.event_year}${
    activity.total_count ? ` · ${activity.total_count} participants` : ''
  }`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function ActivityDetailPage(props: { params: Params }) {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <ActivityDetailContent {...props} />
      </Suspense>
    </SiteShell>
  );
}

async function ActivityDetailContent({ params }: { params: Params }) {
  const { id } = await params;
  const activity = await getActivityById(id);
  if (!activity) notFound();

  const male = activity.male_count ?? 0;
  const female = activity.female_count ?? 0;
  const total = activity.total_count ?? male + female;
  const reach = activity.reach ?? 0;
  const femalePct = total > 0 ? Math.round((female / total) * 100) : 0;
  const femaleHint = total > 0 ? `${femalePct}% of total` : undefined;

  const title = activityTitle(activity);
  const heroPhoto = activity.media_urls?.[0];
  const galleryPhotos = activity.media_urls?.slice(1) ?? [];

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-12 sm:space-y-16">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </nav>

      {/* Hero ------------------------------------------------------ */}
      <Reveal>
      <header className="space-y-6">
        {heroPhoto && (
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-lift">
            <Image
              src={heroPhoto}
              alt={`${title} cover photo`}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-eyebrow text-muted-foreground">
            {activity.sub_project?.name && (
              <Link
                href={`/programs/${activity.sub_project.slug}`}
                className="text-accent hover:text-accent-deep"
              >
                {activity.sub_project.name}
              </Link>
            )}
            {activity.category?.name && (
              <>
                <span aria-hidden>·</span>
                <span>{activity.category.name}</span>
              </>
            )}
            {activity.sub_category?.name && activity.sub_category.name !== title && (
              <>
                <span aria-hidden>·</span>
                <span>{activity.sub_category.name}</span>
              </>
            )}
          </div>
          <h1 className="text-display text-[clamp(2rem,5.5vw,4rem)] text-ink max-w-4xl">
            {title}
          </h1>
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              <dt className="sr-only">Date</dt>
              <dd>{formatDate(activity.activity_date, activity.month_label)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd>
                {activity.location ? (
                  <Link
                    href={`/locations/${activity.location.slug}`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {activity.location.name}
                  </Link>
                ) : (
                  'Location not set'
                )}
              </dd>
            </div>
            {activity.data_source && (
              <div className="inline-flex items-center gap-1.5">
                <span aria-hidden>·</span>
                <dt className="sr-only">Data source</dt>
                <dd>{activity.data_source}</dd>
              </div>
            )}
            {activity.discourse_url && (
              <a
                href={activity.discourse_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-deep"
              >
                Discussion thread
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </dl>
        </div>
      </header>
      </Reveal>

      {/* Highlights pull-quote ------------------------------------ */}
      {activity.highlights && (
        <Reveal delay={0.05}>
          <PullQuote attribution={activity.location?.name ?? 'Sierra Leone'}>
            “{activity.highlights}”
          </PullQuote>
        </Reveal>
      )}

      {/* KPI strip ------------------------------------------------- */}
      <Reveal delay={0.05}>
      <section
        aria-label="Activity metrics"
        className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 rounded-3xl bg-paper shadow-card px-5 sm:px-8 py-8"
      >
        <StatTile label="Participants" value={total} hint={femaleHint} tone="primary" forceRender />
        <StatTile label="Male" value={male} forceRender={total > 0} />
        <StatTile label="Female" value={female} forceRender={total > 0} />
        <StatTile label="Reach" value={reach} hint="Broader audience" forceRender={reach > 0} />
      </section>
      </Reveal>

      {reach > 0 && total > 0 && (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="size-4" aria-hidden="true" />
          Reach multiplier:{' '}
          <strong className="font-serif text-lg text-ink">
            {(reach / total).toFixed(1)}×
          </strong>{' '}
          beyond in-person participants.
        </p>
      )}

      {/* Outcomes rich text ---------------------------------------- */}
      {activity.outcomes && (
        <Reveal delay={0.05}>
        <section aria-labelledby="outcomes-heading" className="space-y-4">
          <header>
            <SectionEyebrow tone="accent">Outcomes</SectionEyebrow>
            <h2 id="outcomes-heading" className="font-serif text-3xl text-ink mt-2 leading-tight">
              What changed
            </h2>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            <RichText json={activity.outcomes} />
          </div>
        </section>
        </Reveal>
      )}

      {/* Photo gallery -------------------------------------------- */}
      {galleryPhotos.length > 0 && (
        <Reveal delay={0.05}>
        <section aria-labelledby="photos-heading" className="space-y-4">
          <header>
            <SectionEyebrow tone="accent">Photos</SectionEyebrow>
            <h2 id="photos-heading" className="font-serif text-3xl text-ink mt-2 leading-tight">
              From the activity
            </h2>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {galleryPhotos.map((url, i) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-card"
              >
                <Image
                  src={url}
                  alt={`${title} photo ${i + 2}`}
                  fill
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
        </Reveal>
      )}

      {/* Partners -------------------------------------------------- */}
      {activity.partner_orgs.length > 0 && (
        <Reveal delay={0.05}>
        <section aria-labelledby="partners-heading" className="space-y-4">
          <SectionEyebrow tone="accent" className="mb-2">In partnership with</SectionEyebrow>
          <h2 id="partners-heading" className="sr-only">Partners</h2>
          <div className="flex flex-wrap gap-2">
            {activity.partner_orgs.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-ink shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </section>
        </Reveal>
      )}

      {/* Demographics --------------------------------------------- */}
      {(activity.age_bands.length > 0 || activity.roles.length > 0) && (
        <Reveal delay={0.05}>
        <section aria-labelledby="demographics-heading" className="space-y-4">
          <header>
            <SectionEyebrow tone="accent">Demographics</SectionEyebrow>
            <h2 id="demographics-heading" className="font-serif text-3xl text-ink mt-2 leading-tight">
              Who showed up
            </h2>
          </header>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {activity.age_bands.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <SectionEyebrow tone="muted">Age bands</SectionEyebrow>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {activity.age_bands.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-sm font-medium text-accent-deep"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {activity.roles.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <SectionEyebrow tone="muted">Roles</SectionEyebrow>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {activity.roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center rounded-full border border-signal/30 bg-signal/10 px-3 py-0.5 text-sm font-medium text-signal"
                      style={{
                        backgroundColor: 'rgba(47,93,98,0.08)',
                        borderColor: 'rgba(47,93,98,0.25)',
                        color: '#2F5D62',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        </Reveal>
      )}

      {/* Notes ----------------------------------------------------- */}
      {activity.notes && (
        <Reveal delay={0.05}>
        <section aria-labelledby="notes-heading" className="space-y-3">
          <SectionEyebrow tone="muted" className="mb-2">Notes</SectionEyebrow>
          <h2 id="notes-heading" className="sr-only">Notes</h2>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground shadow-card">
            {activity.notes}
          </div>
        </section>
        </Reveal>
      )}

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
