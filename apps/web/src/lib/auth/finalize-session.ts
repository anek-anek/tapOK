'use client';

import { deleteUser, fetchSignInMethodsForEmail, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { setAuthToken } from '@/services/api';
import type { DbUser } from '@/components/providers/auth-provider';
import { postSessionCookie, type SessionCookieError } from '@/lib/auth/session-cookie';

export type AuthMode = 'login' | 'signup';
export type AuthProvider = 'password' | 'google';

export type FinalizeFailureReason =
  | 'no_account'
  | 'link_denied'
  | 'backend_unavailable'
  | 'invalid_credentials'
  | 'session_invalid'
  | 'error';

export type FinalizeResult =
  | { ok: true; dbUser: DbUser; shouldOnboard: boolean }
  | {
      ok: false;
      reason: FinalizeFailureReason;
      message: string;
      status?: number;
      code?: string;
    };

interface SyncPayload {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthday?: string;
  userHandle?: string;
}

async function clearSessionCookie() {
  setAuthToken(null);
  await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDeletedEmail(email?: string | null) {
  if (!email) return;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const methods = await fetchSignInMethodsForEmail(getFirebaseAuth(), email);
      if (methods.length === 0) return;
    } catch {
      return;
    }

    await delay(250);
  }
}

async function cleanupFailedAuth(
  firebaseUser: FirebaseUser,
  options: { deleteCreatedUser?: boolean } = {},
) {
  setAuthToken(null);

  if (options.deleteCreatedUser) {
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser?.uid === firebaseUser.uid) {
        await deleteUser(auth.currentUser);
        await waitForDeletedEmail(firebaseUser.email);
      }
    } catch {
      // Best effort cleanup — sign-out below still clears client state.
    }
  }

  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore sign-out cleanup errors
  }

  await clearSessionCookie();
}

function mapSessionError(error: SessionCookieError): Omit<Extract<FinalizeResult, { ok: false }>, 'ok'> {
  const message = error.message || 'Something went wrong. Please try again.';

  if (error.code === 'NO_ACCOUNT' || error.status === 404) {
    return {
      reason: 'no_account',
      message: 'No TapOK account found. Please sign up first.',
      status: error.status,
      code: error.code,
    };
  }

  if (error.code === 'ACCOUNT_LINK_DENIED' || error.status === 403) {
    return {
      reason: 'link_denied',
      message,
      status: error.status,
      code: error.code,
    };
  }

  if (error.code === 'INVALID_OR_EXPIRED_TOKEN' || error.status === 401) {
    return {
      reason: 'session_invalid',
      message,
      status: error.status,
      code: error.code,
    };
  }

  if (error.code === 'API_UNAVAILABLE' || error.status === 503) {
    return {
      reason: 'backend_unavailable',
      message,
      status: error.status,
      code: error.code,
    };
  }

  if (error.code === 'INVALID_CREDENTIALS' || error.status === 400) {
    return {
      reason: 'invalid_credentials',
      message,
      status: error.status,
      code: error.code,
    };
  }

  return {
    reason: 'error',
    message,
    status: error.status,
    code: error.code,
  };
}

export async function finalizeSession(
  firebaseUser: FirebaseUser,
  options: {
    mode: AuthMode;
    provider?: AuthProvider;
    payload?: SyncPayload;
    deleteCreatedUserOnFailure?: boolean;
  },
): Promise<FinalizeResult> {
  try {
    const token = await firebaseUser.getIdToken();
    setAuthToken(token);

    const result = await postSessionCookie(token, {
      sync: true,
      payload: { ...(options.payload ?? {}), authMode: options.mode },
    });

    if (!result.ok) {
      const failure = mapSessionError(result.error);
      await cleanupFailedAuth(firebaseUser, {
        deleteCreatedUser: options.deleteCreatedUserOnFailure,
      });
      return { ok: false, ...failure };
    }

    if (!result.dbUser) {
      await cleanupFailedAuth(firebaseUser, {
        deleteCreatedUser: options.deleteCreatedUserOnFailure,
      });
      return {
        ok: false,
        reason: 'error',
        message: 'Auth synchronization failed. Please try again.',
      };
    }

    return {
      ok: true,
      dbUser: result.dbUser,
      shouldOnboard: options.mode === 'signup' && !result.dbUser.userHandle,
    };
  } catch {
    await cleanupFailedAuth(firebaseUser, {
      deleteCreatedUser: options.deleteCreatedUserOnFailure,
    });
    return {
      ok: false,
      reason: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }
}
