import { jwtVerify, createRemoteJWKSet } from 'jose';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

export const firebaseJwks = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

export type SessionRole = 'admin' | 'participant';

export type VerifiedFirebaseSession = {
  uid: string;
  role: SessionRole | null;
  exp?: number;
};

export async function verifyFirebaseSessionToken(token: string): Promise<VerifiedFirebaseSession | null> {
  try {
    let payload: Awaited<ReturnType<typeof jwtVerify>>['payload'] | null = null;

    try {
      const verifiedSession = await jwtVerify(token, firebaseJwks, {
        issuer: `https://session.firebase.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      });
      payload = verifiedSession.payload;
    } catch {
      const verifiedIdToken = await jwtVerify(token, firebaseJwks, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      });
      payload = verifiedIdToken.payload;
    }

    const roleRaw = (payload as Record<string, unknown>)['role'];
    const role: SessionRole | null =
      roleRaw === 'admin' || roleRaw === 'participant' ? roleRaw : null;

    return {
      uid: payload.sub!,
      role,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}
