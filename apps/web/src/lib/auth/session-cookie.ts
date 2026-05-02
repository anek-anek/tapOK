'use client';

import { setAuthToken } from '@/services/api';

export type SessionProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sets httpOnly `__session` (Firebase ID token) and optional `user_profile` on the Next.js host. Returns dbUser. */
export async function postSessionCookie(
  idToken: string,
  options: { sync?: boolean; payload?: any } = {},
): Promise<{ ok: boolean; dbUser?: any }> {
  const body = JSON.stringify({ idToken, ...options });
  const attempts = 3;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, dbUser: data.dbUser };
      }

      const retryable = res.status >= 500 && res.status !== 503;
      if (retryable && attempt < attempts - 1) {
        await delay(250 * (attempt + 1));
        continue;
      }
      return { ok: false };
    } catch {
      if (attempt < attempts - 1) {
        await delay(250 * (attempt + 1));
        continue;
      }
      return { ok: false };
    }
  }
  return { ok: false };
}


/** Updates axios Authorization and persists the token to the session cookie (proxy / full navigation). */
export async function applyIdTokenToAxiosAndSessionCookie(idToken: string): Promise<boolean> {
  setAuthToken(idToken);
  const res = await postSessionCookie(idToken);
  return res.ok;
}

