'use client';

import { setAuthToken } from '@/services/api';

export type SessionProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
};

/** Sets httpOnly `__session` (Firebase ID token) and optional `user_profile` on the Next.js host. */
export async function postSessionCookie(
  idToken: string,
  profile?: SessionProfilePayload,
): Promise<boolean> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile ? { idToken, profile } : { idToken }),
  });
  return res.ok;
}

/** Updates axios Authorization and persists the token to the session cookie (proxy / full navigation). */
export async function applyIdTokenToAxiosAndSessionCookie(idToken: string): Promise<boolean> {
  setAuthToken(idToken);
  return postSessionCookie(idToken);
}
