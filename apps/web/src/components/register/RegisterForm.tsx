'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { signUpSchema, type SignUpFormValues } from '@/lib/validations/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { finalizeSession } from '@/lib/auth/finalize-session';
import { getRegisterFirebaseError } from '@/lib/auth/firebase-auth-errors';
import { resolveGoogleRedirectSession } from '@/lib/auth/google-redirect';
import {
  shouldDeleteGoogleUserOnFinalizeFailure,
  signInWithGoogleInteractive,
} from '@/lib/auth/google-signin';
import { lookupExistingAuthProvider } from '@/lib/auth/provider-check';
import { buildAuthPageHref, resolveAuthSuccessRedirect } from '@/lib/auth/redirects';
import { AuthFormField, AuthPageShell, authInputClass } from '@/components/auth/AuthPageShell';
import { useAuthFormReset } from '@/lib/auth/use-auth-form-reset';
import { toast } from 'react-hot-toast';

interface RegisterFormProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

const PENDING_SIGNUP_CLEANUP_KEY = 'tapok:pending-signup-cleanup';
const SIGN_UP_DEFAULT_VALUES: SignUpFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RegisterForm({ searchParams }: RegisterFormProps) {
  const { redirectTo = '/drops' } = use(searchParams);
  const router = useRouter();
  const { user, dbUser, setSession } = useAuth();
  const handledSuccessRedirectRef = useRef(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: SIGN_UP_DEFAULT_VALUES,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRedirectResolved, setGoogleRedirectResolved] = useState(false);

  const showError = useCallback((message: string) => {
    toast.error(message.toUpperCase());
  }, []);

  const resetFormState = useCallback(() => {
    reset(SIGN_UP_DEFAULT_VALUES);
    setShowPassword(false);
    setShowConfirm(false);
  }, [reset]);

  const { formRef, clearForm } = useAuthFormReset(resetFormState);

  const completeSuccessfulSignUp = (
    firebaseUser: Parameters<typeof setSession>[0],
    result: Extract<Awaited<ReturnType<typeof finalizeSession>>, { ok: true }>,
    fallbackFirstName: string,
  ) => {
    toast.success('ACCOUNT CREATED');
    setSession(firebaseUser, result.dbUser);
    handledSuccessRedirectRef.current = true;
    router.replace(
      resolveAuthSuccessRedirect({
        mode: 'signup',
        redirectTo,
        firstName: result.dbUser.firstName || fallbackFirstName,
        shouldOnboard: result.shouldOnboard,
      }),
    );
  };

  const rememberPendingSignupCleanup = useCallback((email: string) => {
    sessionStorage.setItem(
      PENDING_SIGNUP_CLEANUP_KEY,
      JSON.stringify({ email, timestamp: Date.now() }),
    );
  }, []);

  const clearPendingSignupCleanup = useCallback(() => {
    sessionStorage.removeItem(PENDING_SIGNUP_CLEANUP_KEY);
  }, []);

  const hasRecentPendingSignupCleanup = useCallback((email: string) => {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_CLEANUP_KEY);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw) as { email?: string; timestamp?: number };
      return parsed.email === email && typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < 5 * 60_000;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (handledSuccessRedirectRef.current) return;
    if (!googleRedirectResolved) return;

    if (user && dbUser && !googleLoading && !isSubmitting) {
      router.replace(
        resolveAuthSuccessRedirect({
          mode: 'login',
          redirectTo,
          firstName: dbUser.firstName,
          shouldOnboard: false,
        }),
      );
    }
  }, [user, dbUser, googleLoading, googleRedirectResolved, isSubmitting, router, redirectTo]);

  useEffect(() => {
    if (
      handledSuccessRedirectRef.current ||
      !googleRedirectResolved ||
      !user ||
      dbUser ||
      googleLoading ||
      isSubmitting
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const finalized = await finalizeSession(user, { mode: 'login' });
      if (cancelled || !finalized.ok) {
        if (!cancelled && !finalized.ok) {
          showError(finalized.message);
        }
        return;
      }

      setSession(user, finalized.dbUser);
      router.replace(
        resolveAuthSuccessRedirect({
          mode: 'login',
          redirectTo,
          firstName: finalized.dbUser.firstName,
          shouldOnboard: false,
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dbUser, googleLoading, googleRedirectResolved, isSubmitting, redirectTo, router, setSession, showError]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const resolution = await resolveGoogleRedirectSession('signup');
      if (cancelled) return;

      if (resolution.status === 'success') {
        toast.success('WELCOME TO TAPOK');
        setSession(resolution.user, resolution.finalized.dbUser);
        handledSuccessRedirectRef.current = true;
        router.replace(
          resolveAuthSuccessRedirect({
            mode: 'signup',
            redirectTo,
            firstName: resolution.finalized.dbUser.firstName,
            shouldOnboard: resolution.finalized.shouldOnboard,
          }),
        );
      } else if (resolution.status === 'finalize_error') {
        showError(resolution.finalized.message);
      } else if (
        resolution.status === 'firebase_error' &&
        resolution.code !== 'auth/popup-closed-by-user'
      ) {
        showError(getRegisterFirebaseError(resolution.code));
      }

      setGoogleLoading(false);
      setGoogleRedirectResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo, setSession, showError]);

  const handleGoogleSignUp = async () => {
    const normalizedEmail = getValues('email').trim().toLowerCase();

    if (!normalizedEmail) {
      showError('Enter your email first to continue with Google.');
      return;
    }

    try {
      const existingAuthProvider = await lookupExistingAuthProvider(normalizedEmail);
      if (existingAuthProvider === 'password') {
        showError(getRegisterFirebaseError('auth/account-exists-with-different-credential'));
        return;
      }
    } catch {
      showError('Unable to verify this email right now. Please try again.');
      return;
    }

    setGoogleLoading(true);
    try {
      const outcome = await signInWithGoogleInteractive(normalizedEmail);
      if (outcome === 'redirect') return;

      const finalized = await finalizeSession(outcome.user, {
        mode: 'signup',
        provider: 'google',
        deleteCreatedUserOnFailure: shouldDeleteGoogleUserOnFinalizeFailure(outcome),
      });

      if (!finalized.ok) {
        showError(finalized.message);
        return;
      }

      toast.success('WELCOME TO TAPOK');
      clearForm();
      setSession(outcome.user, finalized.dbUser);
      handledSuccessRedirectRef.current = true;
      router.replace(
        resolveAuthSuccessRedirect({
          mode: 'signup',
          redirectTo,
          firstName: finalized.dbUser.firstName,
          shouldOnboard: finalized.shouldOnboard,
        }),
      );
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        showError(getRegisterFirebaseError(code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (values: SignUpFormValues) => {
    clearForm();
    try {
      const { user } = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        values.email,
        values.password,
      );
      const finalized = await finalizeSession(user, {
        mode: 'signup',
        provider: 'password',
        payload: { firstName: values.firstName.trim(), lastName: values.lastName.trim() },
        deleteCreatedUserOnFailure: true,
      });

      if (!finalized.ok) {
        rememberPendingSignupCleanup(values.email);
        showError(finalized.message);
        return;
      }

      clearPendingSignupCleanup();
      completeSuccessfulSignUp(user, finalized, values.firstName.trim());
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';

      if (code === 'auth/email-already-in-use') {
        try {
          if (hasRecentPendingSignupCleanup(values.email)) {
            await delay(500);

            const recovered = await signInWithEmailAndPassword(
              getFirebaseAuth(),
              values.email,
              values.password,
            );
            const finalized = await finalizeSession(recovered.user, {
              mode: 'signup',
              provider: 'password',
              payload: { firstName: values.firstName.trim(), lastName: values.lastName.trim() },
              deleteCreatedUserOnFailure: true,
            });

            if (!finalized.ok) {
              rememberPendingSignupCleanup(values.email);
              showError(finalized.message);
              return;
            }

            clearPendingSignupCleanup();
            completeSuccessfulSignUp(recovered.user, finalized, values.firstName.trim());
            return;
          }
        } catch (retryError: unknown) {
          const retryCode = (retryError as { code?: string }).code ?? '';
          showError(getRegisterFirebaseError(retryCode || code));
          return;
        }
      }

      showError(getRegisterFirebaseError(code));
    }
  };

  return (
    <AuthPageShell>
      <div className="mb-5 lg:mb-3">
        <div
          className="auth-panel-in mb-3 inline-flex items-center gap-2 lg:mb-2"
          style={{
            background: 'var(--color-tok-black)',
            color: 'var(--color-tok-cream)',
            fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '2px solid var(--color-tok-black)',
            boxShadow: '3px 3px 0 #006666',
          }}
        >
          NEW HERE
        </div>
        <h1
          className="auth-panel-in font-passion font-bold uppercase leading-none text-tok-black"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em', animationDelay: '0.05s' }}
        >
          TAP IN.
        </h1>
        <p className="auth-panel-in mt-2 font-inter text-sm text-tok-black/55 lg:mt-1.5" style={{ animationDelay: '0.1s' }}>
          Already have an account?{' '}
          <Link
            href={buildAuthPageHref('/login', redirectTo)}
            className="font-semibold text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || isSubmitting}
        className="auth-panel-in mb-5 flex w-full items-center justify-center gap-3 border-2 border-tok-black bg-white px-5 py-3 font-inter text-sm font-medium text-tok-black transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 lg:mb-3.5 lg:py-2.5"
        style={{ boxShadow: '4px 4px 0 #262624', borderRadius: 0, animationDelay: '0.15s' }}
        onMouseEnter={(e) => {
          if (!googleLoading && !isSubmitting) {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #262624';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #262624';
        }}
      >
        {googleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="auth-panel-in mb-5 flex items-center gap-3 lg:mb-3.5" style={{ animationDelay: '0.2s' }}>
        <div className="h-[2px] flex-1 bg-tok-black/12" />
        <span className="font-passion text-xs uppercase tracking-[0.12em] text-tok-black/35">Or continue with</span>
        <div className="h-[2px] flex-1 bg-tok-black/12" />
      </div>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        autoComplete="off"
        className="flex flex-col gap-4 lg:gap-3"
      >
        <div className="auth-panel-in flex flex-col gap-4 sm:flex-row sm:gap-3 lg:gap-2.5" style={{ animationDelay: '0.25s' }}>
          <AuthFormField label="First name" error={errors.firstName?.message}>
            <input
              {...register('firstName')}
              type="text"
              autoComplete="off"
              placeholder="Enter your first name"
              className={authInputClass}
              aria-invalid={!!errors.firstName}
            />
          </AuthFormField>
          <AuthFormField label="Last name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              type="text"
              autoComplete="off"
              placeholder="Enter your last name"
              className={authInputClass}
              aria-invalid={!!errors.lastName}
            />
          </AuthFormField>
        </div>

        <AuthFormField label="Email address" error={errors.email?.message} animClass="auth-panel-in" style={{ animationDelay: '0.3s' }}>
          <input
            {...register('email')}
            type="email"
            autoComplete="off"
            placeholder="Enter your email"
            className={authInputClass}
            aria-invalid={!!errors.email}
          />
        </AuthFormField>

        <AuthFormField label="Password" error={errors.password?.message} animClass="auth-panel-in" style={{ animationDelay: '0.35s' }}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="off"
              placeholder="Create a password"
              className={`${authInputClass} pr-10`}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tok-black/35 transition-all duration-150 hover:scale-110 hover:text-tok-black/65"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={15} className="transition-all duration-150" />
              ) : (
                <Eye size={15} className="transition-all duration-150" />
              )}
            </button>
          </div>
        </AuthFormField>

        <AuthFormField label="Confirm password" error={errors.confirmPassword?.message} animClass="auth-panel-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="off"
              placeholder="Confirm your password"
              className={`${authInputClass} pr-10`}
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tok-black/35 transition-all duration-150 hover:scale-110 hover:text-tok-black/65"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? (
                <EyeOff size={15} className="transition-all duration-150" />
              ) : (
                <Eye size={15} className="transition-all duration-150" />
              )}
            </button>
          </div>
        </AuthFormField>

        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="auth-panel-in mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] active:translate-y-0 active:shadow-none lg:py-3 lg:text-[1.35rem]"
          style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease', opacity: isSubmitting || googleLoading ? 0.6 : 1, cursor: isSubmitting || googleLoading ? 'not-allowed' : 'pointer', animationDelay: '0.45s' }}
          onMouseEnter={(e) => {
            if (!isSubmitting && !googleLoading) {
              (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px #262624';
              (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px #262624';
            (e.currentTarget as HTMLElement).style.backgroundColor = '';
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span className="animate-fade-in">Creating account…</span>
            </>
          ) : (
            'TAP IN'
          )}
        </button>

        <p className="auth-panel-in text-center font-inter text-xs text-tok-black/35 lg:text-[11px]" style={{ animationDelay: '0.5s' }}>
          By signing up, you agree to our{' '}
          <Link href="/" className="underline underline-offset-4 transition-colors duration-150 hover:text-tok-black/70">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/" className="underline underline-offset-4 transition-colors duration-150 hover:text-tok-black/70">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
