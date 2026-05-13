import Link from 'next/link';
import { MobileNav } from './mobile-nav';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/map', label: 'Map' },
  { href: '/partners', label: 'Partners' },
  { href: '/report', label: 'Report' },
] as const;

export function SiteNav() {
  return (
    <header data-print-hide className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-paper/85 backdrop-blur-md px-3 sm:px-5 py-2.5 shadow-card">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-primary-foreground font-serif text-base font-medium leading-none"
            >
              D
            </span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-semibold tracking-tight text-ink truncate">
                DPG Tracker
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Sierra Leone
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1 rounded-full border border-border bg-background/60 px-1 py-1"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-ink hover:bg-card px-3.5 py-1.5 rounded-full transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
