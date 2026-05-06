import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl().replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const payload = body?.payload ?? {};

  // The bearer plugin on the API exposes the signed session token in the
  // set-auth-token response header after sign-in. The client passes it here
  // so we can forward it as Authorization: Bearer — the bearer plugin converts
  // it back to the signed cookie internally, allowing BetterAuthGuard to work.
  const bearerToken: string | undefined = body?.bearerToken;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    } else {
      headers['cookie'] = req.headers.get('cookie') ?? '';
    }

    const res = await fetch(`${API_URL}/users/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message =
        res.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : res.status === 503
            ? 'The service is temporarily unavailable. Please try again later.'
            : errorData?.message ?? 'Unable to finalize your session.';

      return NextResponse.json(
        {
          ok: false,
          error: errorData?.error ?? 'SESSION_FINALIZE_FAILED',
          message,
          code: errorData?.code,
        },
        { status: res.status },
      );
    }

    const dbUser = await res.json();
    const response = NextResponse.json({ ok: true, dbUser });

    // Mirror the session cookie onto the web domain so Next.js middleware
    // (proxy.ts) can read it for route protection.
    if (bearerToken) {
      response.cookies.set('__Secure-better-auth.session_token', bearerToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'API_UNAVAILABLE', message: 'Cannot reach the backend API.' },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
