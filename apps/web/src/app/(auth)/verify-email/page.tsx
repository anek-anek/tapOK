'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import Link from 'next/link';

import { AuthPageShell } from '@/components/auth/AuthPageShell';

const REDIRECT_DELAY = 5;

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get('verified') === 'true';
  const error = searchParams.get('error');
  const pending = searchParams.get('pending') === 'true';

  const [countdown, setCountdown] = useState(REDIRECT_DELAY);

  useEffect(() => {
    if (!verified) return;
    if (countdown <= 0) {
      router.replace('/drops');
      return;
    }
    const id = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [verified, countdown, router]);

  if (verified) {
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
              <CheckCircle2 size={32} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-tok-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
            >
              YOU'RE IN.
            </h1>

            <p className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]">
              Your email has been verified. You now have full access to drops and photo uploads.
            </p>

            <p className="mt-4 font-passion text-sm uppercase tracking-[0.15em] text-tok-black/40">
              Redirecting in{' '}
              <span className="tabular-nums text-tok-teal">{countdown}</span>
              {countdown === 1 ? ' second' : ' seconds'}…
            </p>
          </div>

          <div className="auth-panel-in flex flex-col gap-3" style={{ animationDelay: '0.1s' }}>
            <Link
              href="/drops"
              className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
            >
              Take Me There
            </Link>
            <button
              type="button"
              onClick={() => window.close()}
              className="w-full border-2 border-tok-black/20 bg-transparent px-8 py-3 font-passion text-base uppercase tracking-wider text-tok-black/40 transition-colors hover:border-tok-black/40 hover:text-tok-black/60 lg:py-2.5"
            >
              Close This Window
            </button>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  if (error) {
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
              This verification link has expired or is invalid. Please request a new one from your profile.
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

  if (pending) {
    return (
      <AuthPageShell>
        <div className="flex flex-col gap-6 lg:gap-5">
          <div className="auth-panel-in">
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-black px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#006666]">
              <Mail size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">ALMOST THERE</span>
            </div>

            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-tok-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_0px_#262624] lg:mb-3 lg:h-14 lg:w-14">
              <Mail size={32} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-tok-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
            >
              CHECK YOUR EMAIL.
            </h1>

            <p className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]">
              We sent a verification link to your inbox. Click it to activate your account — you can close this tab afterward.
            </p>
          </div>

          <div className="auth-panel-in" style={{ animationDelay: '0.1s' }}>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return null;
}
