import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ExternalLink,
  Bell,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole, roleLabel } from '@/lib/auth/roles';
import { AdminNavLink, type AdminNavIcon } from '@/components/admin-nav-link';
import { AdminUserMenu } from '@/components/admin-user-menu';

const NAV: { href: string; label: string; icon: AdminNavIcon }[] = [
  { href: '/admin', label: 'Overview', icon: 'overview' },
  { href: '/admin/activities', label: 'Activities', icon: 'activities' },
  { href: '/admin/locations', label: 'Locations', icon: 'locations' },
  { href: '/admin/sub-projects', label: 'Sub-projects', icon: 'programs' },
  { href: '/admin/lookups', label: 'Lookups', icon: 'lookups' },
  { href: '/admin/users', label: 'Team', icon: 'users' },
  { href: '/admin/audit', label: 'Audit log', icon: 'audit' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen flex bg-sidebar">
      <aside className="hidden md:flex md:w-64 shrink-0" />
      <div className="flex-1 lg:p-2">
        <div className="h-full rounded-md border border-border bg-background p-6 space-y-4">
          <div className="h-8 w-48 rounded bg-muted/60 animate-pulse" />
          <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? user.email ?? 'Admin';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? '')
    .join('');
  const role = profile?.role ?? 'viewer';
  if (!isStaffRole(role)) redirect('/login?error=Access%20denied');

  const roleDisplay = roleLabel(role);

  return (
    <div className="min-h-screen flex bg-sidebar text-sidebar-foreground">
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col shrink-0 px-3 lg:px-4 py-3 lg:py-4">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            D
          </span>
          <span className="text-[15px] font-semibold tracking-tight">DPG Tracker</span>
        </Link>

        <div className="mt-3 rounded-lg border border-border bg-card p-3 flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">DPG Workspace</p>
            <p className="text-[11px] text-muted-foreground truncate">Programs · {roleDisplay}</p>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </div>

        <p className="px-2 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Workspace
        </p>
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-2 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-2.5 h-9 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <ExternalLink className="size-4" />
            Public site
          </Link>
          <AdminUserMenu
            variant="sidebar"
            displayName={displayName}
            email={user.email ?? ''}
            role={roleDisplay}
            initials={initials}
          />
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:p-2 lg:pl-0">
        <div className="h-full min-h-[calc(100vh-1rem)] flex flex-col rounded-md lg:border lg:border-border bg-background overflow-hidden">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card sticky top-0 z-10">
            <div className="md:hidden">
              <Link href="/admin" className="font-semibold text-foreground flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
                  D
                </span>
                DPG Admin
              </Link>
            </div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
              </button>
              <AdminUserMenu
                variant="header"
                displayName={displayName}
                email={user.email ?? ''}
                role={roleDisplay}
                initials={initials}
              />
            </div>
          </header>

          <div className="md:hidden border-b border-border bg-card">
            <nav className="flex overflow-x-auto px-3 py-2 gap-1">
              {NAV.map((item) => (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  compact
                />
              ))}
            </nav>
          </div>

          <main className="flex-1 px-4 md:px-6 py-6 bg-background overflow-x-hidden">
            <div className="w-full max-w-[1400px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
