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

async function readSessionDataCookie(
  raw: string,
  secret: string,
): Promise<{ role: UserRole | null } | null> {
  try {
    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json) as {
      session?: { user?: { role?: string } };
      expiresAt?: number;
      signature?: string;
    };

    if (!parsed.session || !parsed.expiresAt || !parsed.signature) return null;
    if (parsed.expiresAt < Date.now()) return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const payload = JSON.stringify({ ...parsed.session, expiresAt: parsed.expiresAt });
    const sigBytes = Uint8Array.from(atob(parsed.signature.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
    if (!valid) return null;

    const role = parsed.session.user?.role;
    return { role: role === 'admin' || role === 'participant' ? role : null };
  } catch {
    return null;
  }
}

async function getSessionAuth(
  request: NextRequest,
): Promise<{ isAuthenticated: boolean; role: UserRole | null }> {
  const sessionToken =
    request.cookies.get('__Secure-better-auth.session_token')?.value ??
    request.cookies.get('better-auth.session_token')?.value;

  if (!sessionToken) return { isAuthenticated: false, role: null };

  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) {
    const sessionData =
      request.cookies.get('__Secure-better-auth.session_data')?.value ??
      request.cookies.get('better-auth.session_data')?.value;

    if (sessionData) {
      const cached = await readSessionDataCookie(sessionData, secret);
      if (cached) return { isAuthenticated: true, role: cached.role };
    }
  }

  return { isAuthenticated: true, role: null };
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
