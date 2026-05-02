'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import {
  AuthFormField,
  AuthPageShell,
  authInputClass,
} from '@/components/auth/AuthPageShell';
import { useAuth } from '@/components/providers/auth-provider';
import { getFirebaseAuth } from '@/lib/firebase';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/network-request-failed':
    'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

const recoverySteps = [
  {
    id: '01',
    title: 'Use your TapOK sign-in email',
    copy: 'Reset links only land in the inbox already tied to your account.',
  },
  {
    id: '02',
    title: 'Check spam before retrying',
    copy: 'Recovery emails can get filtered into promotions, updates, or junk folders.',
  },
];

function getFirebaseError(code: string): string {
  return FIREBASE_ERRORS[code] ?? 'Something went wrong. Please try again.';
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/drops');
    }
  }, [loading, router, user]);

  const onSubmit = async (values: ForgotFormValues) => {
    setServerError(null);

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), values.email);
      setSentTo(values.email);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      setServerError(getFirebaseError(code));
    }
  };

  const resetSuccessState = () => {
    setServerError(null);
    setSentTo(null);
  };

  return (
    <AuthPageShell>
      {loading && !user && (
        <p
          className="auth-panel-in mb-5 text-center font-inter text-xs uppercase tracking-[0.16em] text-black/40"
          aria-live="polite"
        >
          Connecting to TapOK...
        </p>
      )}

      {sentTo ? (
        <div className="flex flex-col gap-6">
          <div className="auth-panel-in">
            <div
              className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#006666]"
              style={{ animationDelay: '0.05s' }}
            >
              <MailCheck size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                LINK SENT
              </span>
            </div>

            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_0px_#262624]">
              <MailCheck size={28} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-black"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.01em',
              }}
            >
              CHECK YOUR INBOX.
            </h1>

            <p
              className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-black/55"
              aria-live="polite"
            >
              We sent a password reset link to{' '}
              <span className="font-semibold text-black/75">{sentTo}</span>. If
              you do not see it in a minute, check spam or request another link.
            </p>
          </div>

          <div
            className="auth-panel-in overflow-hidden border-2 border-tok-black bg-tok-white shadow-[4px_4px_0px_0px_#262624]"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="border-b-2 border-dashed border-tok-black/15 bg-tok-teal/10 px-4 py-3">
              <p className="font-passion text-xs uppercase tracking-[0.18em] text-tok-teal">
                What Happens Next
              </p>
            </div>

            <div className="px-4 py-2">
              {recoverySteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex gap-4 py-4 ${index < recoverySteps.length - 1 ? 'border-b border-dashed border-tok-black/12' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-tok-black bg-tok-cream font-passion text-sm text-tok-teal shadow-[2px_2px_0px_0px_#262624]">
                    {step.id}
                  </div>
                  <div>
                    <p className="font-passion text-lg uppercase leading-none text-black">
                      {step.title}
                    </p>
                    <p className="mt-1 font-inter text-sm leading-relaxed text-black/50">
                      {step.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="auth-panel-in flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: '0.15s' }}
          >
            <Link
              href="/login"
              className="flex flex-1 items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-5 py-3.5 font-passion text-xl uppercase tracking-[0.08em] text-white shadow-[5px_5px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[6px_6px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624]"
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>

            <button
              type="button"
              onClick={resetSuccessState}
              className="flex items-center justify-center border-2 border-tok-black bg-tok-cream px-5 py-3.5 font-passion text-lg uppercase tracking-[0.08em] text-black shadow-[4px_4px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-white hover:shadow-[5px_5px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#262624] sm:flex-none"
            >
              Try Another Email
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div
              className="auth-panel-in mb-3 inline-flex items-center gap-2 border-2 border-black bg-tok-teal px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#000]"
              style={{ animationDelay: '0.05s' }}
            >
              <ShieldCheck size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                Recovery Mode
              </span>
            </div>

            <h1
              className="auth-panel-in font-passion font-bold uppercase leading-none text-black"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.01em',
                animationDelay: '0.1s',
              }}
            >
              GET BACK IN.
            </h1>

            <p
              className="auth-panel-in mt-3 max-w-sm font-inter text-sm leading-relaxed text-black/55"
              style={{ animationDelay: '0.15s' }}
            >
              Enter your email for a reset link.
            </p>

            <p
              className="auth-panel-in mt-2 max-w-sm font-inter text-sm leading-relaxed text-black/55"
              style={{ animationDelay: '0.17s' }}
            >
              Already remember it?{' '}
              <Link
                href="/login"
                className="font-semibold text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
              >
                Head back to sign in
              </Link>
              .
            </p>
          </div>

          <div
            className="auth-panel-in mb-5 overflow-hidden border-2 border-tok-black bg-tok-white shadow-[4px_4px_0px_0px_#262624]"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="border-b-2 border-dashed border-tok-black/15 bg-black px-4 py-3">
              <p className="font-passion text-xs uppercase tracking-[0.18em] text-tok-cream">
                Recovery Protocol
              </p>
            </div>

            <div className="px-4 py-2">
              {recoverySteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex gap-4 py-4 ${index < recoverySteps.length - 1 ? 'border-b border-dashed border-tok-black/12' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-tok-black bg-tok-teal font-passion text-sm text-tok-cream shadow-[2px_2px_0px_0px_#262624]">
                    {step.id}
                  </div>
                  <div>
                    <p className="font-passion text-lg uppercase leading-none text-black">
                      {step.title}
                    </p>
                    <p className="mt-1 font-inter text-sm leading-relaxed text-black/50">
                      {step.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <AuthFormField
              label="Email address"
              error={errors.email?.message}
              animClass="auth-panel-in"
              style={{ animationDelay: '0.25s' }}
            >
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className={authInputClass}
                aria-invalid={!!errors.email}
              />
            </AuthFormField>

            {serverError && (
              <div
                className="auth-panel-in border-2 border-red-600 bg-red-50 px-4 py-3 shadow-[3px_3px_0px_0px_#dc2626]"
                style={{ animationDelay: '0.3s' }}
                aria-live="assertive"
              >
                <p className="font-inter text-xs font-medium uppercase tracking-[0.08em] text-red-700">
                  {serverError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-panel-in tapok-btn mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624]"
              style={{ animationDelay: '0.35s' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <p
              className="auth-panel-in text-center font-inter text-[11px] uppercase tracking-[0.16em] leading-relaxed text-black/30"
              style={{ animationDelay: '0.4s' }}
            >
              Password reset emails usually arrive within a minute.
            </p>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
