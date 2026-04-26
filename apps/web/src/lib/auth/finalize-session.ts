'use client';

import { deleteUser, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api, setAuthToken } from '@/services/api';
import type { DbUser } from '@/components/providers/auth-provider';

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

    let dbUser: DbUser;

    if (options.sync) {
      const { data } = await api.post<DbUser>('/users/sync', options.payload ?? {});
      dbUser = data;
    } else {
      const res = await api.get<DbUser>('/users/me');
      dbUser = res.data;
    }

    const freshToken = await firebaseUser.getIdToken(true);
    setAuthToken(freshToken);

    const sessionRes = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: freshToken }),
    });

    if (!sessionRes.ok) {
      await clearSession();
      return { ok: false, reason: 'error', message: 'Something went wrong. Please try again.' };
    }

    return { ok: true, dbUser };
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;

    if (status === 404) {
      const { creationTime, lastSignInTime } = firebaseUser.metadata;
      if (creationTime && creationTime === lastSignInTime) {
        await deleteUser(firebaseUser).catch(() => undefined);
      } else {
        await signOut(auth).catch(() => undefined);
      }
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
