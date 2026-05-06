'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resolveAuthSuccessRedirect, sanitizeRedirectTo } from '@/lib/auth/redirects';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl().replace(/\/$/, '');

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const redirectTo = sanitizeRedirectTo(searchParams.get('redirectTo'));
    const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

    (async () => {
      let firstName = '';
      let shouldOnboard = true;

      try {
        const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
          credentials: 'include',
          cache: 'no-store',
        });

        let sessionToken: string | undefined;
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          sessionToken = sessionData?.session?.token as string | undefined;
        }

        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: {}, sessionToken }),
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          firstName = data.dbUser?.firstName ?? '';
          shouldOnboard = data.dbUser?.onboardingCompleted === false;
        }
      } catch {
        // non-fatal — redirect to login with error
      }

      const target = resolveAuthSuccessRedirect({ mode, redirectTo, firstName, shouldOnboard });
      router.replace(target);
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-tok-cream">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-tok-teal" />
        <p className="font-passion text-sm uppercase tracking-[0.18em] text-tok-black/55">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
