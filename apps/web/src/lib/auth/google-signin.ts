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
const GOOGLE_REDIRECT_PENDING_KEY = 'tapok_google_redirect_pending';
const GOOGLE_EMAIL_HINT_KEY = 'tapok_auth_email_hint';

function setGoogleRedirectPending(value: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, value);
  localStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, value);
}

function setGoogleEmailHint(value: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GOOGLE_EMAIL_HINT_KEY, value);
  localStorage.setItem(GOOGLE_EMAIL_HINT_KEY, value);
}

export function shouldDeleteGoogleUserOnFinalizeFailure(userCredential: UserCredential): boolean {
  return getAdditionalUserInfo(userCredential)?.isNewUser === true;
}

export async function signInWithGoogleInteractive(loginHint?: string): Promise<GoogleSignInOutcome> {
  const auth = getFirebaseAuth();
  const provider = createGoogleAuthProvider(loginHint);

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      (prefersGoogleRedirectFlow() && code === 'auth/popup-closed-by-user')
    ) {
      if (loginHint) setGoogleEmailHint(loginHint);
      setGoogleRedirectPending('true');
      await signInWithRedirect(auth, provider);
      return 'redirect';
    }
    throw error;
  }
}
