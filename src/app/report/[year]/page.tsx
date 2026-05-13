import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/public/site-shell';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { Reveal } from '@/components/public/reveal';
import { YoyKpiRow } from '@/components/report/yoy-kpi-row';
import { TopMoversList } from '@/components/report/top-movers-list';
import { NarrativeBlock } from '@/components/report/narrative-block';
import { PrintButton } from '@/components/report/print-button';
import { PageSkeleton } from '@/components/page-skeleton';
import {
  getDashboardSummaryCompare,
  getReportTopMovers,
  getSubProjects,
  getYears,
} from '@/lib/supabase/queries';

type Params = Promise<{ year: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Impact report ${year} · DPG Tracker`,
    description: `Year-over-year impact summary for Sierra Leone’s Digital Public Goods program in ${year}.`,
  };
}

const TOP_LIMIT = 5;

export default function ReportPage(props: { params: Params }) {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <ReportContent {...props} />
      </Suspense>
    </SiteShell>
  );
}

async function ReportContent({ params }: { params: Params }) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) notFound();

  const [summary, subMovers, locMovers, subProjects, years] = await Promise.all([
    getDashboardSummaryCompare(year),
    getReportTopMovers(year, 'sub_project'),
    getReportTopMovers(year, 'location'),
    getSubProjects(),
    getYears(),
  ]);

  const risers = subMovers.filter((m) => (m.delta_pct ?? 0) >= 0).slice(0, TOP_LIMIT);
  const fallers = subMovers
    .filter((m) => (m.delta_pct ?? 0) < 0)
    .slice(0, TOP_LIMIT);
  const locRisers = locMovers.filter((m) => (m.delta_pct ?? 0) >= 0).slice(0, TOP_LIMIT);
  const locFallers = locMovers.filter((m) => (m.delta_pct ?? 0) < 0).slice(0, TOP_LIMIT);

  const kpiRows = [
    { label: 'Participants', current: summary.total_participants, prior: summary.prior_participants },
    { label: 'Female participants', current: summary.total_female, prior: summary.prior_female },
    { label: 'Male participants', current: summary.total_male, prior: summary.prior_male },
    { label: 'Reach (Discourse + comms)', current: summary.total_reach, prior: summary.prior_reach },
    { label: 'Activities', current: summary.activity_count, prior: summary.prior_activity_count },
    { label: 'Locations', current: summary.location_count, prior: summary.prior_location_count },
  ];

  const otherYears = years.filter((y) => y !== year).slice(0, 4);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-10 print:py-0 print:px-0 print:space-y-6"
    >
      <Reveal>
      <header className="flex flex-wrap items-end justify-between gap-4 print:gap-2">
        <div className="space-y-3 max-w-2xl">
          <SectionEyebrow tone="accent">Annual report</SectionEyebrow>
          <h1 className="text-display text-[clamp(2.25rem,6vw,5rem)] text-ink leading-[0.95]">
            {year}
          </h1>
          <p className="font-serif text-lg text-foreground leading-snug">
            DPG Sierra Leone, {year} compared with {year - 1}. Generated from the live tracker. Print, share, or save as PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-print-hide>
          {otherYears.length > 0 && (
            <nav
              aria-label="Other report years"
              className="flex items-center gap-1 text-xs"
            >
              <span className="text-eyebrow text-muted-foreground mr-1">Other years</span>
              {otherYears.map((y) => (
                <Link
                  key={y}
                  href={`/report/${y}`}
                  className="rounded-full border border-border bg-paper px-3 py-1 text-sm font-medium text-foreground hover:bg-card hover:text-accent transition-colors"
                >
                  {y}
                </Link>
              ))}
            </nav>
          )}
          <PrintButton />
        </div>
      </header>
      </Reveal>

      <Reveal delay={0.05}>
      <section aria-labelledby="headline-heading" className="space-y-4 print-keep">
        <header>
          <SectionEyebrow tone="muted">Headline numbers</SectionEyebrow>
          <h2
            id="headline-heading"
            className="font-serif text-3xl text-ink mt-2 leading-tight print:text-xl"
          >
            Year in totals
          </h2>
        </header>
        <YoyKpiRow rows={kpiRows} />
      </section>
      </Reveal>

      <Reveal delay={0.05}>
      <section aria-labelledby="sub-movers-heading" className="space-y-4 print-keep">
        <header>
          <SectionEyebrow tone="muted">Sub-projects</SectionEyebrow>
          <h2
            id="sub-movers-heading"
            className="font-serif text-3xl text-ink mt-2 leading-tight print:text-xl"
          >
            Top movers
          </h2>
        </header>
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          <TopMoversList
            title="Risers"
            movers={risers}
            hrefBase="/programs"
            emptyLabel="No sub-projects grew this year."
          />
          <TopMoversList
            title="Fallers"
            movers={fallers}
            hrefBase="/programs"
            emptyLabel="No sub-projects declined this year."
          />
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.05}>
      <section aria-labelledby="loc-movers-heading" className="space-y-4 print-keep">
        <header>
          <SectionEyebrow tone="muted">Locations</SectionEyebrow>
          <h2
            id="loc-movers-heading"
            className="font-serif text-3xl text-ink mt-2 leading-tight print:text-xl"
          >
            Top movers
          </h2>
        </header>
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          <TopMoversList
            title="Risers"
            movers={locRisers}
            hrefBase="/locations"
            emptyLabel="No locations grew this year."
          />
          <TopMoversList
            title="Fallers"
            movers={locFallers}
            hrefBase="/locations"
            emptyLabel="No locations declined this year."
          />
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.05}>
      <section aria-labelledby="narratives-heading" className="space-y-4">
        <header>
          <SectionEyebrow tone="muted">Program narratives</SectionEyebrow>
          <h2
            id="narratives-heading"
            className="font-serif text-3xl text-ink mt-2 leading-tight print:text-xl"
          >
            Program write-ups
          </h2>
        </header>
        <div className="grid gap-3 sm:gap-4">
          {subProjects
            .filter((sp) => sp.description)
            .map((sp) => (
              <NarrativeBlock
                key={sp.id}
                title={sp.name}
                funderName={sp.funder_name}
                description={sp.description}
              />
            ))}
        </div>
      </section>
      </Reveal>

      <footer className="pt-6 text-xs text-muted-foreground border-t border-border print:border-t-2 print:text-black flex flex-wrap justify-between gap-2">
        <span>DPG Tracker · Sierra Leone · live data</span>
        <span>Exported {new Date().toLocaleDateString()}</span>
      </footer>
    </main>
  );
}
