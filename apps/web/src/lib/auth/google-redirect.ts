'use client';

import { getRedirectResult, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  finalizeSession,
  type AuthMode,
  type FinalizeResult,
} from '@/lib/auth/finalize-session';
import { shouldDeleteGoogleUserOnFinalizeFailure } from '@/lib/auth/google-signin';

type FinalizeSuccess = Extract<FinalizeResult, { ok: true }>;
type FinalizeFailure = Extract<FinalizeResult, { ok: false }>;

export type GoogleRedirectResolution =
  | { status: 'none' }
  | { status: 'success'; user: User; finalized: FinalizeSuccess }
  | { status: 'finalize_error'; finalized: FinalizeFailure }
  | { status: 'firebase_error'; code: string };
const GOOGLE_REDIRECT_PENDING_KEY = 'tapok_google_redirect_pending';
const GOOGLE_EMAIL_HINT_KEY = 'tapok_auth_email_hint';

function consumeStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const fromSession = sessionStorage.getItem(key);
  const fromLocal = localStorage.getItem(key);
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
  return fromSession ?? fromLocal;
}

export async function resolveGoogleRedirectSession(
  mode: AuthMode,
): Promise<GoogleRedirectResolution> {
  try {
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth);
    const redirectPending = consumeStorageValue(GOOGLE_REDIRECT_PENDING_KEY) === 'true';
    const user = result?.user ?? auth.currentUser;
    if (!user) return { status: 'none' };

    const hint = consumeStorageValue(GOOGLE_EMAIL_HINT_KEY);

    const finalized = await finalizeSession(user, {
      mode,
      provider: 'google',
      payload: hint ? { email: hint } : undefined,
      deleteCreatedUserOnFailure: result
        ? shouldDeleteGoogleUserOnFinalizeFailure(result)
        : false,
    });

    if (!finalized.ok) {
      return { status: 'finalize_error', finalized };
    }

    return {
      status: 'success',
      user,
      finalized,
    };
  } catch (error: unknown) {
    return {
      status: 'firebase_error',
      code: (error as { code?: string }).code ?? '',
    };
  }
}
