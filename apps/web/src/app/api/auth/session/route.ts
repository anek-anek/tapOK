import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl().replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const payload = body?.payload ?? {};

  const sessionToken: string | undefined = body?.sessionToken;

  try {
    const cookieHeader = sessionToken
      ? `__Secure-better-auth.session_token=${sessionToken}`
      : (req.headers.get('cookie') ?? '');

    const res = await fetch(`${API_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
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

    // Mirror the session cookie onto the web domain so the Next.js middleware
    // can read it for route protection (proxy.ts checks better-auth.session_token).
    if (sessionToken) {
      response.cookies.set('__Secure-better-auth.session_token', sessionToken, {
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
  // BetterAuth clears its own cookie via POST /api/auth/sign-out.
  // This endpoint is kept for legacy callers during the transition.
  return NextResponse.json({ ok: true });
}
