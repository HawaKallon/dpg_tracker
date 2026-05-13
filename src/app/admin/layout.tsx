import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, LogOut, Search, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import { AdminNavLink, type AdminNavIcon } from '@/components/admin-nav-link';

const NAV: { href: string; label: string; icon: AdminNavIcon }[] = [
  { href: '/admin', label: 'Overview', icon: 'overview' },
  { href: '/admin/activities', label: 'Activities', icon: 'activities' },
  { href: '/admin/locations', label: 'Locations', icon: 'locations' },
  { href: '/admin/sub-projects', label: 'Sub-projects', icon: 'programs' },
  { href: '/admin/lookups', label: 'Lookups', icon: 'lookups' },
  { href: '/admin/audit', label: 'Audit log', icon: 'audit' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — light, airy */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-border bg-background shrink-0">
        <div className="h-14 px-4 flex items-center">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-accent">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white font-bold text-sm">
              D
            </span>
            <span className="text-[15px]">DPG Tracker</span>
          </Link>
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <AdminNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-accent hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Public site
          </Link>
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-accent text-xs font-semibold">
              {initials || 'A'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-accent truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-accent p-1 rounded"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background">
          <div className="md:hidden">
            <Link href="/admin" className="font-semibold text-accent flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white font-bold text-sm">
                D
              </span>
              DPG Admin
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span className="text-xs">Search…</span>
            <kbd className="ml-2 hidden lg:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-accent hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-accent text-xs font-semibold">
              {initials || 'A'}
            </span>
          </div>
        </header>

        {/* Mobile nav strip */}
        <div className="md:hidden border-b border-border">
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

        <main className="flex-1 px-4 md:px-6 py-6 bg-background">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
