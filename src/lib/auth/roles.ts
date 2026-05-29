export type ProfileRole = 'super_admin' | 'admin' | 'viewer';

export function isStaffRole(role: string | null | undefined): role is 'admin' | 'super_admin' {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdminRole(role: string | null | undefined): role is 'super_admin' {
  return role === 'super_admin';
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'super_admin':
      return 'Super admin';
    case 'admin':
      return 'Admin';
    case 'viewer':
      return 'Viewer';
    default:
      return 'User';
  }
}
