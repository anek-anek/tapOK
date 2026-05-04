import { NextRequest, NextResponse } from 'next/server';
import { getRolesRequiredForPath } from '@/lib/auth/route-permissions';
import { isProtectedRoute } from '@/lib/constants/routes';
import type { UserRole } from '@/components/providers/auth-provider';

function resolveApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:3000';
  const urls = envUrl.split(',').map((url) => url.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const prodUrl = urls.find((url) => !url.includes('localhost'));
    if (prodUrl) return prodUrl;
  }
  return urls[0] || 'http://localhost:3000';
}

async function getSessionAuth(
  request: NextRequest,
): Promise<{ isAuthenticated: boolean; role: UserRole | null }> {
  const token = request.cookies.get('__session')?.value;
  if (!token) return { isAuthenticated: false, role: null };

  try {
    const response = await fetch(`${resolveApiUrl().replace(/\/$/, '')}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { isAuthenticated: false, role: null };
    }

    const user = await response.json();
    const role = user?.role === 'admin' || user?.role === 'participant' ? user.role : null;
    return { isAuthenticated: true, role };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const { isAuthenticated, role } = await getSessionAuth(request);

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'redirectTo',
      `${pathname}${request.nextUrl.search}${request.nextUrl.hash}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = getRolesRequiredForPath(pathname);

  if (requiredRoles?.length && (!role || !requiredRoles.includes(role))) {
    const forbiddenUrl = new URL('/forbidden', request.url);
    forbiddenUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
