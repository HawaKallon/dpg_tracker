import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { TeamAccessDenied } from './access-denied';

export default async function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/users');

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (isSuperAdminRole(me?.role)) return children;

  let canClaimSuperAdmin = false;
  if (me?.role === 'admin' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const svc = createServiceClient();
    const { count } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin');
    canClaimSuperAdmin = (count ?? 0) === 0;
  }

  return (
    <div className="py-8">
      <TeamAccessDenied canClaimSuperAdmin={canClaimSuperAdmin} />
    </div>
  );
}
