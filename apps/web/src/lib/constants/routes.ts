export const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/forbidden', '/drops/join'] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function isLoginRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
