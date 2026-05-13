import type { ReactNode } from 'react';
import { SiteNav } from './site-nav';
import { SiteFooter } from './site-footer';
import { SiteBackground } from './site-background';

/**
 * The wrapper every public page renders inside.
 * Sets [data-shell="public"] so the cream/ink token overrides in globals.css
 * apply only here — admin and login stay on neutral defaults.
 */
export function SiteShell({
  children,
  lastUpdated,
}: {
  children: ReactNode;
  lastUpdated?: string;
}) {
  return (
    <div
      data-shell="public"
      className="relative min-h-screen bg-background text-foreground flex flex-col isolate"
    >
      <SiteBackground />
      <SiteNav />
      <div className="flex-1 flex flex-col">{children}</div>
      <SiteFooter lastUpdated={lastUpdated} />
    </div>
  );
}
