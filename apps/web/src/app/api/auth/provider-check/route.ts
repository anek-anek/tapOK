import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json(
      { error: 'INVALID_EMAIL', message: 'Email is required.' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${getApiUrl()}/users/auth-provider-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.error ?? 'PROVIDER_CHECK_FAILED',
          message: data?.message ?? 'Unable to check the email provider.',
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'API_UNAVAILABLE', message: 'Cannot reach the backend API.' },
      { status: 503 },
    );
  }
}
