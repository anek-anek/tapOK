'use client';

import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

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
  if (prefersGoogleRedirectFlow()) {
    await signInWithRedirect(auth, googleProvider);
    return 'redirect';
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return 'redirect';
    }
    throw error;
  }
}
