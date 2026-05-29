import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { claimSuperAdmin } from './actions';

export function TeamAccessDenied({
  canClaimSuperAdmin,
}: {
  canClaimSuperAdmin: boolean;
}) {
  return (
    <div className="max-w-lg mx-auto rounded-xl border border-border bg-card p-8 space-y-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
        <Shield className="size-5" />
      </span>
      <h1 className="text-lg font-semibold text-foreground">Team access is for super admins</h1>
      <p className="text-sm text-muted-foreground">
        Your account is an <strong>admin</strong>, not a <strong>super admin</strong>. You can
        manage activities and locations, but only super admins can invite teammates and change
        roles.
      </p>
      {canClaimSuperAdmin ? (
        <form action={claimSuperAdmin} className="pt-2">
          <p className="text-xs text-muted-foreground mb-3">
            No super admin exists yet. You can claim super admin access for your account (one
            time).
          </p>
          <Button type="submit">Become super admin</Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ask your super admin to invite you, or run:{' '}
          <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
            npx tsx scripts/promote-super-admin.ts your@email.com
          </code>
        </p>
      )}
      <Button variant="outline" asChild>
        <Link href="/admin">Back to admin</Link>
      </Button>
    </div>
  );
}
