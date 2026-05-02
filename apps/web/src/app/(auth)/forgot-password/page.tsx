'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import {
  AuthFormField,
  AuthPageShell,
  authInputClass,
} from '@/components/auth/AuthPageShell';
import { useAuth } from '@/components/providers/auth-provider';
import { useAuthFormReset } from '@/lib/auth/use-auth-form-reset';
import { getForgotPasswordError } from '@/lib/auth/firebase-auth-errors';
import { getFirebaseAuth } from '@/lib/firebase';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

const DEFAULT_VALUES: ForgotFormValues = { email: '' };

const resetTips = [
  {
    id: '01',
    title: 'Password email',
    copy: 'Use the inbox tied to your TapOK password sign-in.',
  },
  {
    id: '02',
    title: 'Google users',
    copy: 'Go back and continue with Google instead of resetting.',
  },
];

const successChecks = [
  {
    id: '01',
    title: 'Wait a minute',
    copy: 'Reset links usually arrive fast.',
  },
  {
    id: '02',
    title: 'Check spam',
    copy: 'Look in junk, updates, or promotions.',
  },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, dbUser, loading } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetFormState = useCallback(() => {
    reset(DEFAULT_VALUES);
  }, [reset]);

  const { formRef, clearForm } = useAuthFormReset(resetFormState);

  useEffect(() => {
    if (!loading && user && dbUser) {
      router.replace('/drops');
    }
  }, [dbUser, loading, router, user]);

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), values.email);
      setSentTo(values.email);
      reset(DEFAULT_VALUES);
      toast.success('RESET LINK SENT');
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';

      if (code === 'auth/user-not-found') {
        setSentTo(values.email);
        reset(DEFAULT_VALUES);
        toast.success('IF AN ACCOUNT EXISTS, A LINK IS ON THE WAY');
        return;
      }

      toast.error(getForgotPasswordError(code).toUpperCase());
    }
  };

  const resetSuccessState = () => {
    setSentTo(null);
    clearForm();
  };

  return (
    <AuthPageShell>
      {loading && !user && (
        <p
          className="auth-panel-in mb-4 text-center font-inter text-xs uppercase tracking-[0.16em] text-tok-black/45 lg:mb-3"
          aria-live="polite"
        >
          Connecting...
        </p>
      )}

      {sentTo ? (
        <div className="flex flex-col gap-4 lg:gap-3">
          <div className="auth-panel-in">
            <div
              className="mb-2 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-black px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#006666]"
              style={{ animationDelay: '0.05s' }}
            >
              <MailCheck size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                LINK SENT
              </span>
            </div>

            <div className="mb-3 flex h-14 w-14 items-center justify-center border-2 border-tok-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_0px_#262624] lg:mb-2 lg:h-12 lg:w-12">
              <MailCheck size={24} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-tok-black"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.01em',
              }}
            >
              CHECK EMAIL.
            </h1>

            <p
              className="mt-2 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-1.5 lg:text-[13px]"
              aria-live="polite"
            >
              If a TapOK password account exists for{' '}
              <span className="font-semibold text-tok-black/80">{sentTo}</span>, a reset
              link should land in about a minute.
            </p>
          </div>

          <div
            className="auth-panel-in grid gap-3 sm:grid-cols-2"
            style={{ animationDelay: '0.1s' }}
          >
            {successChecks.map((item) => (
              <div
                key={item.id}
                className="border-2 border-tok-black bg-tok-white px-4 py-3 shadow-[4px_4px_0px_0px_#262624]"
              >
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border-2 border-tok-black bg-tok-cream font-passion text-xs text-tok-teal shadow-[2px_2px_0px_0px_#262624]">
                  {item.id}
                </div>
                <p className="font-passion text-base uppercase leading-none text-tok-black">
                  {item.title}
                </p>
                <p className="mt-1 font-inter text-sm leading-relaxed text-tok-black/50 lg:text-[13px]">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>

          <div
            className="auth-panel-in flex flex-col gap-3 sm:flex-row lg:gap-2.5"
            style={{ animationDelay: '0.15s' }}
          >
            <Link
              href="/login"
              className="flex flex-1 items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-5 py-3 font-passion text-lg uppercase tracking-[0.08em] text-white shadow-[5px_5px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[6px_6px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-2.5"
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>

            <button
              type="button"
              onClick={resetSuccessState}
              className="flex items-center justify-center border-2 border-tok-black bg-tok-cream px-5 py-3 font-passion text-base uppercase tracking-[0.08em] text-tok-black shadow-[4px_4px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-white hover:shadow-[5px_5px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#262624] sm:flex-none lg:py-2.5"
            >
              Try Another Email
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 lg:mb-3">
            <div
              className="auth-panel-in mb-3 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-teal px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#262624] lg:mb-2"
              style={{ animationDelay: '0.05s' }}
            >
              <ShieldCheck size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                RESET ACCESS
              </span>
            </div>

            <h1
              className="auth-panel-in font-passion font-bold uppercase leading-none text-tok-black"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.01em',
                animationDelay: '0.1s',
              }}
            >
              RESET PASSWORD.
            </h1>

            <p
              className="auth-panel-in mt-2 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-1.5 lg:text-[13px]"
              style={{ animationDelay: '0.15s' }}
            >
              Enter the email tied to your TapOK password account.
            </p>

            <p
              className="auth-panel-in mt-1.5 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:text-[13px]"
              style={{ animationDelay: '0.17s' }}
            >
              Remembered it?{' '}
              <Link
                href="/login"
                className="font-semibold text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
              >
                Sign in
              </Link>
              .
            </p>
          </div>

          <div
            className="auth-panel-in mb-4 grid gap-3 sm:grid-cols-2 lg:mb-3.5"
            style={{ animationDelay: '0.2s' }}
          >
            {resetTips.map((item) => (
              <div className="border-2 border-tok-black bg-tok-white px-4 py-3 shadow-[4px_4px_0px_0px_#262624]" key={item.id}>
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border-2 border-tok-black bg-tok-black font-passion text-xs text-tok-cream shadow-[2px_2px_0px_0px_#262624]">
                  {item.id}
                </div>
                <p className="font-passion text-base uppercase leading-none text-tok-black">
                  {item.title}
                </p>
                <p className="mt-1 font-inter text-sm leading-relaxed text-tok-black/50 lg:text-[13px]">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
            className="flex flex-col gap-4 lg:gap-3"
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
                autoComplete="off"
                placeholder="Enter your email"
                className={authInputClass}
                aria-invalid={!!errors.email}
              />
            </AuthFormField>

            <div
              className="auth-panel-in flex items-center gap-2 border-2 border-tok-black bg-tok-black px-4 py-2.5 text-tok-cream shadow-[3px_3px_0px_0px_#262624]"
              style={{ animationDelay: '0.3s' }}
            >
              <MailCheck size={14} className="shrink-0" />
              <p className="font-inter text-[11px] uppercase tracking-[0.12em] text-tok-cream/75">
                Google accounts use Google sign-in, not reset links.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-panel-in tapok-btn mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
              style={{ animationDelay: '0.35s' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                'Send Link'
              )}
            </button>

            <p
              className="auth-panel-in text-center font-inter text-[11px] uppercase tracking-[0.16em] leading-relaxed text-tok-black/35 lg:text-[10px]"
              style={{ animationDelay: '0.4s' }}
            >
              Reset links usually land within a minute.
            </p>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
