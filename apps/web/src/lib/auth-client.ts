import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '../../../api/src/lib/auth';
import { getApiUrl } from '@/lib/config';

export const authClient = createAuthClient({
  baseURL: `${getApiUrl()}/api/auth`,
  plugins: [inferAdditionalFields<Auth>()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
