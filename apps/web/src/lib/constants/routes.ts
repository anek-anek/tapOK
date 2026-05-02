export const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/forbidden'] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function isAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
}

export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
