import { CalendarOff } from 'lucide-react';
import { Reveal } from '@/components/public/reveal';
import { SectionEyebrow } from '@/components/public/section-eyebrow';

export function EmptyYearState({
  year,
  subject,
  hint,
}: {
  year: number;
  subject: string;
  hint?: string;
}) {
  return (
    <Reveal delay={0.05}>
      <section
        aria-label={`No activity data for ${year}`}
        className="rounded-3xl border border-border bg-paper shadow-card px-6 sm:px-10 py-12 sm:py-16 text-center space-y-4"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarOff className="size-5" aria-hidden="true" />
        </span>
        <SectionEyebrow tone="muted" className="justify-center">
          Nothing yet
        </SectionEyebrow>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
          No activity data yet for {year}.
        </h2>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground">
          {hint ??
            `We don't have any recorded events at ${subject} for ${year}. Try another year using the picker above, or check back as new events are logged.`}
        </p>
      </section>
    </Reveal>
  );
}
