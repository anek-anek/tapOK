import { NextRequest, NextResponse } from 'next/server';
import { PAGE_PERMISSIONS } from '@/lib/auth/route-permissions';
import { isLoginRoute, isProtectedRoute } from '@/lib/constants/routes';
import type { UserRole } from '@/components/providers/auth-provider';

function getSessionRole(request: NextRequest): UserRole | null {
  const role = request.cookies.get('session_role')?.value;
  if (role === 'admin' || role === 'photographer' || role === 'participant') {
    return role;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const role = getSessionRole(request);
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

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
