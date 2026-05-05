import { createAuthClient } from 'better-auth/react';
import type { Auth } from '../../../api/src/lib/auth';
import { getApiUrl } from '@/lib/config';

export const authClient = createAuthClient<Auth>({
  baseURL: `${getApiUrl()}/api/auth`,
});

export const { useSession, signIn, signOut, signUp } = authClient;
