import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let authInstance: Auth | undefined;
let googleProviderInstance: GoogleAuthProvider | undefined;

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('getFirebaseAuth() is only available in the browser');
  }
  authInstance ??= getAuth(app);
  return authInstance;
}

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (typeof window === 'undefined') {
    throw new Error('getGoogleAuthProvider() is only available in the browser');
  }
  googleProviderInstance ??= new GoogleAuthProvider();
  return googleProviderInstance;
}
