import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = '__session';
const PROFILE_COOKIE = 'user_profile';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
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

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: MAX_AGE,
  };

  res.cookies.set(SESSION_COOKIE, idToken, cookieOptions);

  const profile: Profile | undefined = body?.profile;
  if (profile && typeof profile === 'object') {
    res.cookies.set(PROFILE_COOKIE, JSON.stringify(profile), {
      ...cookieOptions,
      httpOnly: false,
    });
  }

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PROFILE_COOKIE);
  return res;
}
