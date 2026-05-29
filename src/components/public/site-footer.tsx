import { Suspense } from 'react';
import Link from 'next/link';
import { programContent } from '@/content/program';
import { FooterYear } from './footer-year';

export function SiteFooter({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <footer
      data-print-hide
      className="mt-16 border-t border-border bg-paper shadow-[inset_0_1px_0_rgba(255,252,245,0.7),inset_0_8px_24px_-12px_rgba(31,27,23,0.08)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 grid gap-8 md:grid-cols-3">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink text-primary-foreground font-serif text-sm leading-none"
            >
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              DPG Tracker
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {programContent.tagline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-eyebrow text-muted-foreground mb-3">Explore</p>
            <ul className="space-y-2">
              <li><Link href="/" className="text-foreground/80 hover:text-accent">Dashboard</Link></li>
              <li><Link href="/map" className="text-foreground/80 hover:text-accent">Map</Link></li>
              <li><Link href="/partners" className="text-foreground/80 hover:text-accent">Partners</Link></li>
              <li><Link href="/report" className="text-foreground/80 hover:text-accent">Annual report</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-eyebrow text-muted-foreground mb-3">About</p>
            <ul className="space-y-2 text-foreground/80">
              <li>{programContent.region}</li>
              <li>{programContent.programName}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 text-sm md:text-right">
          <p className="text-eyebrow text-muted-foreground">Open by default</p>
          <p className="text-foreground/80 leading-relaxed">
            All numbers come straight from the database. New activities show up here within a minute.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            ©{' '}
            <Suspense fallback="2026">
              <FooterYear />
            </Suspense>{' '}
            DPG Tracker · {programContent.region}
          </span>
          {lastUpdated && <span>Last refreshed {lastUpdated}</span>}
        </div>
      </div>
    </footer>
  );
}
