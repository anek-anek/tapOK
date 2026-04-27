import { cookies } from 'next/headers';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { UserRole } from '@/components/providers/auth-provider';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

export interface SessionUser {
  uid: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get('__session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const role = (payload as Record<string, unknown>)['role'];
    if (role !== 'admin' && role !== 'photographer' && role !== 'participant') return null;

    const profileRaw = jar.get('user_profile')?.value;
    let profile: { firstName?: string; lastName?: string; email?: string; avatar?: string } = {};
    if (profileRaw) {
      try {
        profile = JSON.parse(decodeURIComponent(profileRaw));
      } catch {
        // profile cookie is malformed — proceed without it
      }
    }

    return {
      uid: payload.sub!,
      role: role as UserRole,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      avatar: profile.avatar,
    };
  } catch {
    return null;
  }
}
