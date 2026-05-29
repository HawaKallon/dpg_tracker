import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white text-primary font-bold">
            D
          </span>
          DPG Tracker
          <span className="ml-1 text-xs font-normal text-white/80">Sierra Leone</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <Link
            href="/"
            className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
          >
            Dashboard
          </Link>
          <Link
            href="/map"
            className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
          >
            Map
          </Link>
          <Link
            href="/partners"
            className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
          >
            Partners
          </Link>
          <Link
            href="/report"
            className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
          >
            Report
          </Link>
        </nav>
      </div>
    </header>
  );
}
