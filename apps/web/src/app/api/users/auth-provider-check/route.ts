import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = getApiUrl();

    const res = await fetch(`${apiUrl}/users/auth-provider-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/users/auth-provider-check] failed', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to check auth provider.' },
      { status: 500 },
    );
  }
}
