import type { DbUser } from '@/components/providers/auth-provider';

export async function getServerUser(): Promise<DbUser | null> {
  return null;
}
