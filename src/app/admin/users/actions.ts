'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { rateLimit } from '@/lib/security/rate-limit';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!isSuperAdminRole(profile?.role)) {
    throw new Error('Only super admins can manage users.');
  }

  return { supabase, user };
}

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** One-time: first admin can claim super_admin when none exists yet. */
export async function claimSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await rateLimit(user.id, 'admin:claim-super', { max: 3 });

  const svc = createServiceClient();
  const { count: superCount, error: countErr } = await svc
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin');
  if (countErr) throw new Error(countErr.message);
  if ((superCount ?? 0) > 0) {
    throw new Error('A super admin already exists. Ask them for access.');
  }

  const { data: me } = await svc.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    throw new Error('Only existing admins can claim super admin access.');
  }

  const { error } = await svc
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', user.id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/admin/users');
}

export async function inviteAdmin(formData: FormData) {
  const { user } = await requireSuperAdmin();
  await rateLimit(user.id, 'admin:invite', { max: 5 });

  const email = nullable(formData.get('email'));
  const fullName = nullable(formData.get('full_name'));
  if (!email) throw new Error('Email is required');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  const svc = createServiceClient();
  const { error } = await svc.auth.admin.inviteUserByEmail(email, {
    data: {
      ...(fullName ? { full_name: fullName } : {}),
      profile_role: 'admin',
    },
    redirectTo: siteUrl ? `${siteUrl}/login?next=/admin` : undefined,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}

export async function updateUserRole(formData: FormData) {
  const { user } = await requireSuperAdmin();
  await rateLimit(user.id, 'admin:invite', { max: 20 });

  const id = nullable(formData.get('id'));
  const role = nullable(formData.get('role'));
  if (!id || (role !== 'admin' && role !== 'viewer')) {
    throw new Error('Invalid request');
  }

  const svc = createServiceClient();

  const { data: target } = await svc.from('profiles').select('role').eq('id', id).maybeSingle();
  if (target?.role === 'super_admin') {
    throw new Error('Cannot change the role of a super admin.');
  }

  if (role === 'viewer') {
    const { count: adminCount } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    const { count: superCount } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin');
    if ((adminCount ?? 0) + (superCount ?? 0) <= 1 && target?.role === 'admin') {
      throw new Error('Cannot demote the last remaining admin.');
    }
  }

  const { error } = await svc.from('profiles').update({ role }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}

export async function removeAdmin(formData: FormData) {
  const demote = new FormData();
  demote.set('id', String(formData.get('id') ?? ''));
  demote.set('role', 'viewer');
  await updateUserRole(demote);
}
