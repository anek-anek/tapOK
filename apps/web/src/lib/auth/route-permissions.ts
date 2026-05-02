import type { UserRole } from '@/components/providers/auth-provider';

export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin': ['admin'],
};

/** Roles required for this pathname, if any edge gate applies. */
export function getRolesRequiredForPath(pathname: string): UserRole[] | undefined {
  const exact = PAGE_PERMISSIONS[pathname];
  if (exact?.length) return exact;

  let best: UserRole[] | undefined;
  let bestLen = -1;

  for (const [prefix, roles] of Object.entries(PAGE_PERMISSIONS)) {
    if (!roles?.length) continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (prefix.length > bestLen) {
        best = roles;
        bestLen = prefix.length;
      }
    }
  }

  return best;
}
