import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl().replace(/\/$/, '');

// Proxy all /api/auth/* requests to the NestJS API and relay Set-Cookie headers
// back to the browser on tapok.app. This makes BetterAuth session cookies
// same-origin, eliminating all cross-origin cookie problems.
async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${API_URL}/api/auth/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'transfer-encoding', 'accept-encoding'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined;

  const apiRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
  });

  const resHeaders = new Headers();
  apiRes.headers.forEach((value, key) => {
    // fetch() decompresses the body automatically, so strip encoding headers
    // to prevent the browser from attempting a second decompression pass
    if (['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) return;
    resHeaders.set(key, value);
  });

  return new NextResponse(apiRes.body, {
    status: apiRes.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
