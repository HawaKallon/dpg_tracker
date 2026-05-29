import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { inviteAdmin } from '../actions';

export function InviteForm() {
  return (
    <form
      action={inviteAdmin}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-accent flex items-center gap-2">
          <Mail className="size-4" /> Invite an admin
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sends an email invite. They set their password on first sign-in and join as an
          admin (not super admin). They cannot invite others.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="name@org.org" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" placeholder="Optional" />
        </div>
        <Button type="submit">Send invite</Button>
      </div>
    </form>
  );
}
