import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/public/site-shell';
import { SectionEyebrow } from '@/components/public/section-eyebrow';
import { StatTile } from '@/components/public/stat-tile';
import { Reveal } from '@/components/public/reveal';
import { YearPicker } from '@/components/year-picker';
import { PartnersList } from '@/components/partners-list';
import { PageSkeleton } from '@/components/page-skeleton';
import { getPartnersSummary, getYears } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Partners · DPG Tracker',
  description:
    'Organizations partnering with Sierra Leone’s Digital Public Goods program — universities, NGOs, ministries, hubs, and funders.',
};

type SearchParams = Promise<{ year?: string }>;

export default function PartnersPage(props: { searchParams: SearchParams }) {
  return (
    <SiteShell>
      <Suspense fallback={<PageSkeleton />}>
        <PartnersContent {...props} />
      </Suspense>
    </SiteShell>
  );
}

async function PartnersContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const years = await getYears();
  const requested = sp.year ? Number(sp.year) : null;
  const currentYear = requested && years.includes(requested) ? requested : years[0];

  const partners = await getPartnersSummary(currentYear);

  const totalPartners = partners.length;
  const recurring = partners.filter((p) => p.activity_count > 1).length;
  const totalParticipants = partners.reduce((sum, p) => sum + p.total_participants, 0);

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-10 pt-6 sm:pt-8 pb-8 space-y-10">
      <Reveal>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3 max-w-2xl">
          <SectionEyebrow tone="accent">Partners</SectionEyebrow>
          <h1 className="text-display text-[clamp(2.25rem,5.5vw,4rem)] text-ink leading-[0.95]">
            Who we work with
          </h1>
          <p className="font-serif text-lg text-foreground leading-snug">
            Organizations referenced on activities in {currentYear}. Click any partner to see the activities they joined.
          </p>
        </div>
        <YearPicker years={years} current={currentYear} />
      </section>
      </Reveal>

      <Reveal delay={0.05}>
      <section
        aria-label="Partner metrics"
        className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 rounded-3xl bg-paper shadow-card px-5 sm:px-8 py-8"
      >
        <StatTile
          label="Distinct partners"
          value={totalPartners}
          tone="primary"
          forceRender
        />
        <StatTile
          label="Recurring"
          value={recurring}
          hint=">1 activity in year"
          forceRender={totalPartners > 0}
        />
        <StatTile
          label="Participants reached"
          value={totalParticipants}
          hint="Across all partner activities"
          forceRender={totalPartners > 0}
        />
      </section>
      </Reveal>

      <Reveal delay={0.05}>
        <PartnersList partners={partners} year={currentYear} />
      </Reveal>
    </main>
  );
}
