import { redirect } from 'next/navigation';
import { UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { roleLabel } from '@/lib/auth/roles';
import { ListToolbar } from '../_components/list-toolbar';
import { EmptyState } from '../_components/empty-state';
import { InviteForm } from './_components/invite-form';
import { updateUserRole, removeAdmin } from './actions';

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'viewer';
  created_at: string;
};

function roleBadgeVariant(role: ProfileRow['role']) {
  if (role === 'super_admin') return 'default' as const;
  if (role === 'admin') return 'success' as const;
  return 'outline' as const;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/users');

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as ProfileRow[];

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Team access"
        count={rows.length}
        description="Invite colleagues as admins. They can manage activities and locations but cannot invite others or change roles."
      />

      <InviteForm />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No users yet"
            description="Invite your first teammate using the form above."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH className="w-[1%]" />
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => {
                const isSelf = p.id === user.id;
                const canManage = p.role !== 'super_admin' && !isSelf;

                return (
                  <TR key={p.id}>
                    <TD className="font-medium text-foreground">
                      {p.full_name ?? '—'}
                      {isSelf && (
                        <span className="ml-2 text-[11px] text-muted-foreground">(you)</span>
                      )}
                    </TD>
                    <TD className="text-muted-foreground">{p.email}</TD>
                    <TD>
                      <Badge variant={roleBadgeVariant(p.role)}>{roleLabel(p.role)}</Badge>
                    </TD>
                    <TD className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {p.role === 'admin' && canManage && (
                          <form action={removeAdmin}>
                            <input type="hidden" name="id" value={p.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Demote to viewer
                            </Button>
                          </form>
                        )}
                        {p.role === 'viewer' && (
                          <form action={updateUserRole}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="role" value="admin" />
                            <Button type="submit" variant="outline" size="sm" disabled={!canManage}>
                              Make admin
                            </Button>
                          </form>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
