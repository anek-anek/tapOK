const DEFAULT_AUTH_REDIRECT = '/drops';

export function sanitizeRedirectTo(
  redirectTo?: string | null,
  fallback: string = DEFAULT_AUTH_REDIRECT,
): string {
  if (!redirectTo) return fallback;
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) return fallback;

  try {
    const url = new URL(redirectTo, 'https://tapok.app');
    if (url.origin !== 'https://tapok.app') return fallback;

    const normalized = `${url.pathname}${url.search}${url.hash}`;
    if (!normalized.startsWith('/')) return fallback;
    return normalized;
  } catch {
    return fallback;
  }
}

export function buildAuthPageHref(pathname: '/login' | '/register', redirectTo?: string | null): string {
  const safeRedirect = sanitizeRedirectTo(redirectTo);
  if (safeRedirect === DEFAULT_AUTH_REDIRECT) return pathname;
  return `${pathname}?redirectTo=${encodeURIComponent(safeRedirect)}`;
}

export function isCrewJoinRedirect(redirectTo: string): boolean {
  return redirectTo.startsWith('/drops/join/');
}

export function buildOnboardingHref(firstName: string, redirectTo?: string | null): string {
  const params = new URLSearchParams();
  if (firstName.trim()) {
    params.set('name', firstName.trim());
  }

  const safeRedirect = sanitizeRedirectTo(redirectTo);
  if (safeRedirect !== DEFAULT_AUTH_REDIRECT) {
    params.set('redirectTo', safeRedirect);
  }

  const query = params.toString();
  return query ? `/onboarding?${query}` : '/onboarding';
}

export function resolveAuthSuccessRedirect(options: {
  mode: 'login' | 'signup';
  redirectTo?: string | null;
  firstName: string;
  shouldOnboard: boolean;
}): string {
  const safeRedirect = sanitizeRedirectTo(options.redirectTo);

  if (options.shouldOnboard) {
    return buildOnboardingHref(options.firstName, safeRedirect);
  }

  if (options.mode === 'login') {
    return safeRedirect;
  }

  if (isCrewJoinRedirect(safeRedirect)) {
    return safeRedirect;
  }

  return safeRedirect;
}
