'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { getFirebaseAuth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/config';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid or missing verification link.');
      setStatus('error');
      return;
    }

    void (async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/auth/email/confirm-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const code = body?.code ?? '';
          setErrorMessage(
            code === 'TOKEN_EXPIRED'
              ? 'This verification link has expired. Please request a new one.'
              : 'Invalid or expired verification link.',
          );
          setStatus('error');
          return;
        }

        // Force-refresh the Firebase token so emailVerified claim is up to date
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true);
        }

        toast.success('EMAIL VERIFIED');
        setStatus('success');
      } catch {
        setErrorMessage('Something went wrong. Please try again.');
        setStatus('error');
      }
    })();
  }, [token]);

  if (status === 'loading') {
    return (
      <AuthPageShell>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-tok-teal" />
          <p className="font-passion text-sm uppercase tracking-[0.2em] text-tok-black/40">
            Verifying your email...
          </p>
        </div>
      </AuthPageShell>
    );
  }

  if (status === 'error') {
    return (
      <AuthPageShell>
        <div className="flex flex-col gap-6 lg:gap-5">
          <div className="auth-panel-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-tok-black bg-red-50 text-red-600 shadow-[4px_4px_0px_0px_#262624] lg:mb-3 lg:h-14 lg:w-14">
              <AlertTriangle size={32} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-tok-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
            >
              LINK EXPIRED.
            </h1>

            <p className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]">
              {errorMessage}
            </p>
          </div>

          <div className="auth-panel-in" style={{ animationDelay: '0.1s' }}>
            <Link
              href="/profile?verify=true"
              className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
            >
              Resend Verification Email
            </Link>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <div className="flex flex-col gap-6 lg:gap-5">
        <div className="auth-panel-in">
          <div
            className="mb-3 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-black px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#006666]"
            style={{ animationDelay: '0.05s' }}
          >
            <CheckCircle2 size={14} />
            <span className="font-passion text-[10px] uppercase tracking-[0.18em]">ACCOUNT VERIFIED</span>
          </div>

          <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-tok-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_0px_#262624] lg:mb-3 lg:h-14 lg:w-14">
            <Mail size={32} />
          </div>

          <h1
            className="font-passion font-bold uppercase leading-none text-tok-black"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
          >
            EMAIL VERIFIED.
          </h1>

          <p className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]">
            Your email address has been successfully verified. You now have full access to create drops and upload sparks.
          </p>
        </div>

        <div className="auth-panel-in" style={{ animationDelay: '0.1s' }}>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
          >
            Sign In to TapOK
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
