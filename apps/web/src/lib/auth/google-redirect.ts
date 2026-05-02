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

export async function resolveGoogleRedirectSession(
  mode: AuthMode,
): Promise<GoogleRedirectResolution> {
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result) return { status: 'none' };

    const hint = typeof window !== 'undefined' ? sessionStorage.getItem('tapok_auth_email_hint') : null;
    if (typeof window !== 'undefined') sessionStorage.removeItem('tapok_auth_email_hint');

    const finalized = await finalizeSession(result.user, {
      mode,
      provider: 'google',
      payload: hint ? { email: hint } : undefined,
      deleteCreatedUserOnFailure: shouldDeleteGoogleUserOnFinalizeFailure(result),
    });

    if (!finalized.ok) {
      return { status: 'finalize_error', finalized };
    }

    return {
      status: 'success',
      user: result.user,
      finalized,
    };
  } catch (error: unknown) {
    return {
      status: 'firebase_error',
      code: (error as { code?: string }).code ?? '',
    };
  }
}
