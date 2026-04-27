import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = '__session';
const PROFILE_COOKIE = 'user_profile';
const MAX_AGE = 3600;

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

function sessionCookieHeader(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function profileCookieHeader(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${PROFILE_COOKIE}=${value}; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
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
  res.headers.append('Set-Cookie', sessionCookieHeader(idToken, MAX_AGE));

  const profile: Profile | undefined = body?.profile;
  if (profile && typeof profile === 'object') {
    const encoded = encodeURIComponent(JSON.stringify(profile));
    res.headers.append('Set-Cookie', profileCookieHeader(encoded, MAX_AGE));
  }

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', sessionCookieHeader('', 0));
  res.headers.append('Set-Cookie', profileCookieHeader('', 0));
  return res;
}
