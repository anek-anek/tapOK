'use client';

import { deleteUser, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { api, setAuthToken } from '@/services/api';
import type { DbUser } from '@/components/providers/auth-provider';
import { postSessionCookie } from '@/lib/auth/session-cookie';

export type FinalizeResult =
  | { ok: true; dbUser: DbUser }
  | { ok: false; reason: 'no_account' | 'error'; message: string };

interface SyncPayload {
  firstName?: string;
  lastName?: string;
}

async function clearSession() {
  setAuthToken(null);
  await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
}

export async function finalizeSession(
  firebaseUser: FirebaseUser,
  options: { sync: boolean; payload?: SyncPayload } = { sync: false },
): Promise<FinalizeResult> {
  try {
    const token = await firebaseUser.getIdToken();
    setAuthToken(token);

    // Consolidated: One network call from client to Next.js API, which then proxies to external API.
    const result = await postSessionCookie(token, {
      sync: options.sync,
      payload: options.payload,
    });

    if (!result.ok || !result.dbUser) {
      await clearSession();
      return { ok: false, reason: 'error', message: 'Auth synchronization failed. Please try again.' };
    }

    return { ok: true, dbUser: result.dbUser };
  } catch (error: unknown) {
    const err = error as any;
    const status = err.status ?? err.response?.status;
    const looksLikeMissingAccount = status === 404;

    if (looksLikeMissingAccount) {
      await clearSession();
      return {
        ok: false,
        reason: 'no_account',
        message: 'No TapOK account found. Please sign up first.',
      };
    }

    await clearSession();
    return {
      ok: false,
      reason: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }
}

