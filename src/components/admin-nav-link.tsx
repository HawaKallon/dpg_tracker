'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Database,
  History,
  MapPin,
  FolderKanban,
  Users,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ICONS = {
  overview: LayoutDashboard,
  activities: ListChecks,
  locations: MapPin,
  programs: FolderKanban,
  lookups: Database,
  users: Users,
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

  if (compact) {
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2 px-3 h-8 rounded-md text-sm whitespace-nowrap transition-colors',
          active
            ? 'bg-sidebar-accent text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60'
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 h-[38px] text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60'
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {active && <ChevronRight className="size-3.5 text-muted-foreground opacity-60" />}
    </Link>
  );
}
