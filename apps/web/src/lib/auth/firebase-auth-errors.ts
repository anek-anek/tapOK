'use client';

const NETWORK_ERROR = 'Network error. Check your connection and try again.';
const TOO_MANY_REQUESTS = 'Too many attempts. Please try again later.';
const GOOGLE_TO_PASSWORD_MISMATCH =
  'This email is already registered with email and password. Sign in with your password instead.';
const GOOGLE_ACCOUNT_IN_USE =
  'This Google account is already connected to another TapOK account. Try signing in instead.';

export function getLoginFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'No TapOK account found. Please sign up first.';
    case 'auth/account-exists-with-different-credential':
      return GOOGLE_TO_PASSWORD_MISMATCH;
    case 'auth/credential-already-in-use':
      return GOOGLE_ACCOUNT_IN_USE;
    case 'auth/too-many-requests':
      return TOO_MANY_REQUESTS;
    case 'auth/network-request-failed':
      return NETWORK_ERROR;
    case 'auth/redirect-cancelled-or-blocked':
      return 'Google sign-in was blocked by your browser. If you use Brave or Safari, please ensure "Prevent Cross-Site Tracking" is disabled or try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function getRegisterFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Sign in instead.';
    case 'auth/account-exists-with-different-credential':
      return GOOGLE_TO_PASSWORD_MISMATCH;
    case 'auth/credential-already-in-use':
      return GOOGLE_ACCOUNT_IN_USE;
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return TOO_MANY_REQUESTS;
    case 'auth/network-request-failed':
      return NETWORK_ERROR;
    case 'auth/redirect-cancelled-or-blocked':
      return 'Google sign-up was blocked by your browser. If you use Brave or Safari, please ensure "Prevent Cross-Site Tracking" is disabled or try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function getForgotPasswordError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return TOO_MANY_REQUESTS;
    case 'auth/network-request-failed':
      return NETWORK_ERROR;
    default:
      return 'Something went wrong. Please try again.';
  }
}
