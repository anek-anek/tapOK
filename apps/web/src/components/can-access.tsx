'use client';

import { useAuth, type UserRole } from '@/components/providers/auth-provider';

interface CanAccessProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CanAccess({ role, children, fallback = null }: CanAccessProps) {
  const { dbUser, loading } = useAuth();

  if (loading || !dbUser) return <>{fallback}</>;

  const allowed = Array.isArray(role) ? role.includes(dbUser.role) : dbUser.role === role;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
