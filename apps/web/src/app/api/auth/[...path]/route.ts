import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/config';

const API_URL = getServerApiUrl().replace(/\/$/, '');

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${API_URL}/api/auth/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (['host', 'connection', 'transfer-encoding', 'accept-encoding'].includes(k)) {
      return;
    }

    if (k === 'cookie') {
      const filteredCookies = value
        .split(';')
        .map((c) => c.trim())
        .filter((c) => c.startsWith('better-auth') || c.startsWith('__Secure-better-auth'))
        .join('; ');

      if (filteredCookies) {
        headers.set(key, filteredCookies);
      }
    } else {
      headers.set(key, value);
    }
  });

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined;

  let apiRes: Response;
  try {
    apiRes = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });
  } catch (err) {
    const cookieHeader = req.headers.get('cookie') || '';
    console.error('[auth-proxy] fetch failed', {
      url,
      error: err,
      cookieHeaderLength: cookieHeader.length,
      filteredCookieLength: headers.get('cookie')?.length || 0,
      headerNames: Array.from(req.headers.keys()),
    });
    return new NextResponse(`Auth proxy error: ${String(err)}`, { status: 502 });
  }

  const resHeaders = new Headers();
  apiRes.headers.forEach((value, key) => {
    if (['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) return;
    if (key.toLowerCase() === 'set-cookie') {
      resHeaders.append(key, value);
    } else {
      resHeaders.set(key, value);
    }
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
