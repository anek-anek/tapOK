import { cookies } from 'next/headers';
import { DbUser } from '@/components/providers/auth-provider';

export async function getServerUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  const profileCookie = cookieStore.get('user_profile');

  if (!profileCookie?.value) {
    return null;
  }

  try {
    const profile = JSON.parse(decodeURIComponent(profileCookie.value));
    return profile as DbUser;
  } catch {
    return null;
  }
}
