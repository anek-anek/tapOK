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

    const sessionOk = await postSessionCookie(freshToken, {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      avatar: dbUser.avatar,
    });

    if (!sessionOk) {
      await clearSession();
      return { ok: false, reason: 'error', message: 'Something went wrong. Please try again.' };
    }

    return { ok: true, dbUser };
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      response?: { status?: number; data?: { message?: string | string[]; error?: string } };
    };
    const response = err.response;
    const status = response?.status ?? err.status;
    const rawMessage = response?.data?.message;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    const errorLabel = String(response?.data?.error ?? '').toLowerCase();
    const normalizedMessage = String(message ?? '').toLowerCase();
    const looksLikeMissingAccount =
      errorLabel.includes('not found') ||
      normalizedMessage.includes('not found') ||
      normalizedMessage.includes('no account') ||
      normalizedMessage.includes('user does not exist');

    const shouldTreatAsNoAccount =
      status === 404 ||
      (!options.sync && (status === 401 || status === 403)) ||
      ((status === 401 || status === 403) && looksLikeMissingAccount);

    if (shouldTreatAsNoAccount) {
      const { creationTime, lastSignInTime } = firebaseUser.metadata;
      if (creationTime && creationTime === lastSignInTime) {
        await deleteUser(firebaseUser).catch(() => undefined);
      } else {
        await signOut(getFirebaseAuth()).catch(() => undefined);
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
