import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Users2,
  TrendingUp,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/kpi-card';
import { getActivityById } from '@/lib/supabase/queries';

export const revalidate = 60;

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

export default async function ActivityDetailPage({ params }: { params: Params }) {
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

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-primary-deep hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </nav>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {activity.sub_project?.name && <Badge variant="default">{activity.sub_project.name}</Badge>}
            {activity.category?.name && (
              <span className="text-xs text-muted-foreground">{activity.category.name}</span>
            )}
            {activity.sub_category?.name && activity.sub_category.name !== title && (
              <span className="text-xs text-muted-foreground">· {activity.sub_category.name}</span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-accent">{title}</h1>
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden="true" />
              <dt className="sr-only">Date</dt>
              <dd>{formatDate(activity.activity_date, activity.month_label)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd>{activity.location?.name ?? 'Location not set'}</dd>
            </div>
            {activity.data_source && (
              <div className="inline-flex items-center gap-1.5">
                <Users2 className="size-4" aria-hidden="true" />
                <dt className="sr-only">Data source</dt>
                <dd>{activity.data_source}</dd>
              </div>
            )}
            {activity.discourse_url && (
              <a
                href={activity.discourse_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary-deep hover:underline"
              >
                Discussion thread
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </dl>
        </header>

        <section
          aria-label="Activity metrics"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <KpiCard label="Participants" value={total} hint={femaleHint} />
          <KpiCard label="Male" value={male} />
          <KpiCard label="Female" value={female} />
          <KpiCard label="Reach" value={reach} hint="Broader audience" />
        </section>

        {reach > 0 && total > 0 && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <TrendingUp className="size-4" aria-hidden="true" />
            Reach multiplier: <strong className="text-accent">{(reach / total).toFixed(1)}×</strong>{' '}
            beyond in-person participants.
          </p>
        )}

        {activity.notes && (
          <section aria-label="Notes" className="space-y-3">
            <h2 className="text-lg font-semibold text-accent">Notes</h2>
            <div className="rounded-xl border border-border bg-card p-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {activity.notes}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
