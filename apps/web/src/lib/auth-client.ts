import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '../../../api/src/lib/auth';
import { getBaseUrl } from '@/lib/config';

// Point at the same-origin /api/auth proxy (apps/web/src/app/api/auth/[...path]/route.ts)
// so BetterAuth session cookies land on tapok.app, not tapok-api.vercel.app.
export const authClient = createAuthClient({
  baseURL: `${getBaseUrl()}/api/auth`,
  plugins: [inferAdditionalFields<Auth>()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
