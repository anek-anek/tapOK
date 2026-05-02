'use client';

import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { getFirebaseAuth, getGoogleAuthProvider } from '@/lib/firebase';

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

export async function signInWithGoogleInteractive(): Promise<GoogleSignInOutcome> {
  const auth = getFirebaseAuth();
  const provider = getGoogleAuthProvider();

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
