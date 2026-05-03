/**
 * Utility to handle base URLs from environment variables.
 * Supports comma-separated lists, returning the first one as the primary.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!envUrl) {
    // Fallback for Vercel preview environments
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'https://tapok.app';
  }

  // Handle multiple URLs (comma separated)
  const urls = envUrl.split(',').map(u => u.trim()).filter(Boolean);
  return urls[0] || 'https://tapok.app';
}

export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:3000';
  
  const urls = envUrl.split(',').map(u => u.trim()).filter(Boolean);
  
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const prodUrl = urls.find(u => !u.includes('localhost'));
    if (prodUrl) return prodUrl;
  }
  
  return urls[0] || 'http://localhost:3000';
}

export const PRIMARY_DOMAIN = getBaseUrl();
export const API_URL = getApiUrl();

export function absoluteUrlForMetadata(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('/')) {
    const base = getBaseUrl().replace(/\/$/, '');
    return `${base}${pathOrUrl}`;
  }
  return pathOrUrl;
}

const DEFAULT_COVER_PATHS = new Set(['/tapok-hangout.png', '/tapok-party.png']);

export function coverPhotoSrcForNextImage(url: string): string {
  if (url.startsWith('/') && DEFAULT_COVER_PATHS.has(url)) return url;
  try {
    const { pathname } = new URL(url);
    if (DEFAULT_COVER_PATHS.has(pathname)) return pathname;
  } catch {
    /* relative or invalid */
  }
  return url;
}
