import Link from 'next/link';
import { Lock, Mail, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithPassword, sendMagicLink } from './actions';

type SearchParams = Promise<{ error?: string; info?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = sp.next ?? '/admin';

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <section className="hidden lg:flex flex-col justify-between bg-primary text-white p-12 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,39,89,0.6) 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary font-bold">
              D
            </span>
            DPG Tracker
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            Admin Console
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            Track Sierra Leone&apos;s Digital Public Goods program.
          </h1>
          <p className="text-white/85 text-base leading-relaxed">
            Log activities, monitor reach across universities and hubs, and keep one source of
            truth for stakeholders.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div>
              <p className="text-3xl font-semibold">2.3K+</p>
              <p className="text-xs text-white/70 mt-1">Participants tracked</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">10+</p>
              <p className="text-xs text-white/70 mt-1">Universities</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">6</p>
              <p className="text-xs text-white/70 mt-1">Sub-programs</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} DPG Sierra Leone
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </div>

          <div>
            <div className="lg:hidden mb-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white font-bold">
                D
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-accent">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to manage activities and review the audit log.
            </p>
          </div>

          {sp.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {sp.error}
            </div>
          )}
          {sp.info && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {sp.info}
            </div>
          )}

          <form action={signInWithPassword} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="relative text-center">
            <span className="inline-block bg-background relative z-10 px-3 text-xs uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          <form action={sendMagicLink} className="space-y-3">
            <Label htmlFor="magic-email" className="text-muted-foreground">
              Email me a sign-in link instead
            </Label>
            <div className="flex gap-2">
              <Input
                id="magic-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <Button type="submit" variant="outline">
                Send
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent hover:underline">
              ← Back to public dashboard
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
