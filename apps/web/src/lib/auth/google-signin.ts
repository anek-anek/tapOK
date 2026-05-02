'use client';

import { getAdditionalUserInfo, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { createGoogleAuthProvider, getFirebaseAuth } from '@/lib/firebase';

export function prefersGoogleRedirectFlow(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return true;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  return false;
}

export type GoogleSignInOutcome = UserCredential | 'redirect';

export function shouldDeleteGoogleUserOnFinalizeFailure(userCredential: UserCredential): boolean {
  return getAdditionalUserInfo(userCredential)?.isNewUser === true;
}

export async function signInWithGoogleInteractive(loginHint?: string): Promise<GoogleSignInOutcome> {
  const auth = getFirebaseAuth();
  const provider = createGoogleAuthProvider(loginHint);

  if (prefersGoogleRedirectFlow()) {
    await signInWithRedirect(auth, provider);
    return 'redirect';
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return 'redirect';
    }
    throw error;
  }
}
