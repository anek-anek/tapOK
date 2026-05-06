import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl().replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const payload = body?.payload ?? {};

  try {
    // /api/auth/* is proxied through Next.js (next.config.js rewrites), so the
    // session cookie is now same-origin (tapok.app). Forward it directly.
    const res = await fetch(`${API_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
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
    return NextResponse.json({ ok: true, dbUser });
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
