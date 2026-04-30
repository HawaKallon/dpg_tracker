import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
          >
            Dashboard
          </Link>
          {user ? (
            <>
              <Link
                href="/admin"
                className="text-sm text-white/90 hover:text-white px-3 py-2 rounded-md hover:bg-white/10"
              >
                Admin
              </Link>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/15"
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Admin login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
