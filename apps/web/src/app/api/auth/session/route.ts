import { NextRequest, NextResponse } from 'next/server';

const COOKIE = '__session';
const MAX_AGE = 3600;

function cookieHeader(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const idToken: string | undefined = body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const check = await fetch(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!check.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookieHeader(idToken, MAX_AGE));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookieHeader('', 0));
  return res;
}
