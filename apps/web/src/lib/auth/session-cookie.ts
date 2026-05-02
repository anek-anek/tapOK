'use client';

import { setAuthToken } from '@/services/api';

export type SessionProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
};

export interface SessionCookieError {
  status?: number;
  error?: string;
  message: string;
  code?: string;
  upstream?: unknown;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sets httpOnly `__session` (Firebase ID token) and optional `user_profile` on the Next.js host. Returns dbUser. */
export async function postSessionCookie(
  idToken: string,
  options: { sync?: boolean; payload?: any } = {},
): Promise<{ ok: true; dbUser: any } | { ok: false; error: SessionCookieError }> {
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

      const errorData = await res.json().catch(() => null);
      const retryable = res.status >= 500;
      if (retryable && attempt < attempts - 1) {
        await delay(250 * (attempt + 1));
        continue;
      }
      return {
        ok: false,
        error: {
          status: res.status,
          error: errorData?.error,
          message: errorData?.message ?? 'Unable to finalize your session.',
          code: errorData?.code,
          upstream: errorData?.upstream,
        },
      };
    } catch {
      if (attempt < attempts - 1) {
        await delay(250 * (attempt + 1));
        continue;
      }
      return {
        ok: false,
        error: {
          status: 503,
          error: 'API_UNAVAILABLE',
          message: 'Cannot reach the backend API.',
          code: 'API_UNAVAILABLE',
        },
      };
    }
  }
  return {
    ok: false,
    error: {
      status: 500,
      error: 'UNKNOWN_SESSION_ERROR',
      message: 'Unable to finalize your session.',
      code: 'UNKNOWN_SESSION_ERROR',
    },
  };
}


/** Updates axios Authorization and persists the token to the session cookie (proxy / full navigation). */
export async function applyIdTokenToAxiosAndSessionCookie(idToken: string): Promise<boolean> {
  setAuthToken(idToken);
  const res = await postSessionCookie(idToken);
  return res.ok;
}
