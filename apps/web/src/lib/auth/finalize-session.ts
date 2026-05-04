'use client';

import {
  deleteUser,
  fetchSignInMethodsForEmail,
  signOut,
  unlink,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { setAuthToken } from '@/services/api';
import type { DbUser } from '@/components/providers/auth-provider';
import { postSessionCookie, type SessionCookieError } from '@/lib/auth/session-cookie';

export type AuthMode = 'login' | 'signup';
export type AuthProvider = 'password' | 'google';

export type FinalizeFailureReason =
  | 'no_account'
  | 'link_denied'
  | 'auth_provider_mismatch'
  | 'email_not_verified'
  | 'backend_unavailable'
  | 'invalid_credentials'
  | 'session_invalid'
  | 'rate_limited'
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
  email?: string;
  gender?: string;
  birthday?: string;
  userHandle?: string;
  authMode?: AuthMode;
  authProvider?: AuthProvider;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAccepted?: boolean;
  privacyPolicyAcceptedAt?: string;
}

function detectAuthProvider(firebaseUser: FirebaseUser): AuthProvider {
  return firebaseUser.providerData.some((provider) => provider.providerId === 'google.com')
    ? 'google'
    : 'password';
}

function hasProvider(firebaseUser: FirebaseUser, providerId: string): boolean {
  return firebaseUser.providerData.some((provider) => provider.providerId === providerId);
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

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const methods = await fetchSignInMethodsForEmail(getFirebaseAuth(), email);
      if (methods.length === 0) return;
    } catch {
      return;
    }

    await delay(500);
  }
}

async function cleanupFailedAuth(
  firebaseUser: FirebaseUser,
  options: {
    attemptedProvider?: AuthProvider;
    deleteCreatedUser?: boolean;
    failureReason?: FinalizeFailureReason;
  } = {},
) {
  const fatalReasons: FinalizeFailureReason[] = [
    'no_account',
    'link_denied',
    'auth_provider_mismatch',
    'email_not_verified',
    'invalid_credentials',
    'session_invalid',
  ];

  if (options.failureReason && !fatalReasons.includes(options.failureReason)) {
    console.warn(`[finalizeSession] Non-fatal failure (${options.failureReason}). Skipping sign-out cleanup.`);
    return;
  }

  setAuthToken(null);
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser?.uid === firebaseUser.uid ? auth.currentUser : firebaseUser;
  const passwordLinked = hasProvider(currentUser, 'password');
  const googleLinked = hasProvider(currentUser, 'google.com');

  if (
    options.attemptedProvider === 'google' &&
    options.failureReason === 'auth_provider_mismatch' &&
    passwordLinked &&
    googleLinked
  ) {
    try {
      await unlink(currentUser, 'google.com');
    } catch {
      // Best effort rollback — sign-out below still clears local auth state.
    }
  }

  if (options.deleteCreatedUser && !(options.attemptedProvider === 'google' && passwordLinked)) {
    try {
      const userToDelete = auth.currentUser?.uid === firebaseUser.uid ? auth.currentUser : firebaseUser;
      await deleteUser(userToDelete);
      await waitForDeletedEmail(firebaseUser.email);
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

  if (error.code === 'AUTH_PROVIDER_MISMATCH') {
    return {
      reason: 'auth_provider_mismatch',
      message,
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

  if (error.code === 'EMAIL_NOT_VERIFIED') {
    return {
      reason: 'email_not_verified',
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

  if (error.status === 429) {
    return {
      reason: 'rate_limited',
      message: 'Too many requests. Please wait a moment and try again.',
      status: 429,
      code: 'TOO_MANY_REQUESTS',
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
    sync?: boolean;
  },
): Promise<FinalizeResult> {
  try {
    const token = await firebaseUser.getIdToken();
    const authProvider = options.provider ?? detectAuthProvider(firebaseUser);
    setAuthToken(token);

    const result = await postSessionCookie(token, {
      sync: options.sync ?? true,
      payload: { ...(options.payload ?? {}), authMode: options.mode, authProvider },
    });

    if (!result.ok) {
      const failure = mapSessionError(result.error);
      await cleanupFailedAuth(firebaseUser, {
        attemptedProvider: authProvider,
        deleteCreatedUser: options.deleteCreatedUserOnFailure,
        failureReason: failure.reason,
      });
      return { ok: false, ...failure };
    }

    if (!result.dbUser) {
      await cleanupFailedAuth(firebaseUser, {
        attemptedProvider: authProvider,
        deleteCreatedUser: options.deleteCreatedUserOnFailure,
        failureReason: 'error',
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
      attemptedProvider: options.provider ?? detectAuthProvider(firebaseUser),
      deleteCreatedUser: options.deleteCreatedUserOnFailure,
      failureReason: 'error',
    });
    return {
      ok: false,
      reason: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }
}
