'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, Database, History } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ICONS = {
  overview: LayoutDashboard,
  activities: ListChecks,
  lookups: Database,
  audit: History,
} as const;

export type AdminNavIcon = keyof typeof ICONS;

export function AdminNavLink({
  href,
  icon,
  label,
  compact = false,
}: {
  href: string;
  icon: AdminNavIcon;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        compact ? 'px-3 h-8 whitespace-nowrap' : 'px-2.5 h-8',
        active
          ? 'bg-muted text-accent font-medium'
          : 'text-muted-foreground hover:text-accent hover:bg-muted/60'
      )}
    >
      <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : '')} />
      {label}
    </Link>
  );
}
