export const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forbidden'] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function isLoginRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/signup';
}

export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
