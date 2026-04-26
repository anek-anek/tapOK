import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PAGE_PERMISSIONS } from '@/lib/auth/route-permissions';
import { isLoginRoute, isProtectedRoute } from '@/lib/constants/routes';
import type { UserRole } from '@/components/providers/auth-provider';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

async function getSessionRole(request: NextRequest): Promise<UserRole | null> {
  const token = request.cookies.get('__session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const role = (payload as Record<string, unknown>)['role'];
    if (role === 'admin' || role === 'photographer' || role === 'participant') {
      return role as UserRole;
    }
    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const role = await getSessionRole(request);
  const isAuthenticated = role !== null;

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute(pathname) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (isAuthenticated && isProtectedRoute(pathname)) {
    const allowedRoles = PAGE_PERMISSIONS[pathname];

    if (allowedRoles && !allowedRoles.includes(role!)) {
      const forbiddenUrl = new URL('/forbidden', request.url);
      forbiddenUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
