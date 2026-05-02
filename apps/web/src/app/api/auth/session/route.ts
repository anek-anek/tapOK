import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

const SESSION_COOKIE = '__session';
const PROFILE_COOKIE = 'user_profile';
const MAX_AGE = 60 * 60 * 24 * 30;

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const idToken: string | undefined = body?.idToken;
  const sync: boolean = body?.sync ?? false;
  const payload: any = body?.payload;

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  const apiUrl = getApiUrl();
  let dbUserResponse: Response;

  try {
    const endpoint = sync ? '/users/sync' : '/users/me';
    const method = sync ? 'POST' : 'GET';
    
    dbUserResponse = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: { 
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: sync ? JSON.stringify(payload ?? {}) : undefined,
      cache: 'no-store',
    });
  } catch (cause) {
    console.error('[api/auth/session] upstream fetch failed', { apiUrl, cause });
    return NextResponse.json(
      { error: 'API_UNAVAILABLE', message: 'Cannot reach the backend API.' },
      { status: 503 },
    );
  }

  if (!dbUserResponse.ok) {
    const errorData = await dbUserResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: 'Invalid token or user fetch failed', upstream: errorData },
      { status: dbUserResponse.status },
    );
  }

  const dbUser = await dbUserResponse.json();
  const res = NextResponse.json({ ok: true, dbUser });

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
  };

  res.cookies.set(SESSION_COOKIE, idToken, cookieOptions);

  const profile = {
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    email: dbUser.email,
    avatar: dbUser.avatar,
  };
  
  res.cookies.set(PROFILE_COOKIE, encodeURIComponent(JSON.stringify(profile)), {
    ...cookieOptions,
    httpOnly: false,
  });

  return res;
}


export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PROFILE_COOKIE);
  return res;
}
