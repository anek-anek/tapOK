import { NextRequest, NextResponse } from 'next/server';
import { getRolesRequiredForPath } from '@/lib/auth/route-permissions';
import { isProtectedRoute } from '@/lib/constants/routes';
import type { UserRole } from '@/components/providers/auth-provider';
import { verifyFirebaseSessionToken } from '@/lib/auth/session-jwt';

async function getSessionAuth(
  request: NextRequest,
): Promise<{ isAuthenticated: boolean; role: UserRole | null }> {
  const token = request.cookies.get('__session')?.value;
  if (!token) return { isAuthenticated: false, role: null };

  const verified = await verifyFirebaseSessionToken(token);
  if (!verified) return { isAuthenticated: false, role: null };

  return { isAuthenticated: true, role: verified.role as UserRole | null };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { isAuthenticated, role } = await getSessionAuth(request);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'redirectTo',
      `${pathname}${request.nextUrl.search}${request.nextUrl.hash}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isProtectedRoute(pathname)) {
    const requiredRoles = getRolesRequiredForPath(pathname);

    if (requiredRoles?.length && (!role || !requiredRoles.includes(role))) {
      const forbiddenUrl = new URL('/forbidden', request.url);
      forbiddenUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
