'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { finalizeSession } from '@/lib/auth/finalize-session';
import { getLoginFirebaseError } from '@/lib/auth/firebase-auth-errors';
import { resolveGoogleRedirectSession } from '@/lib/auth/google-redirect';
import {
  shouldDeleteGoogleUserOnFinalizeFailure,
  signInWithGoogleInteractive,
} from '@/lib/auth/google-signin';
import { buildAuthPageHref, resolveAuthSuccessRedirect } from '@/lib/auth/redirects';
import { AuthFormField, AuthPageShell, authInputClass } from '@/components/auth/AuthPageShell';
import { useAuthFormReset } from '@/lib/auth/use-auth-form-reset';
import { toast } from 'react-hot-toast';

interface LoginFormProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

const LOGIN_DEFAULT_VALUES: LoginFormValues = { email: '', password: '' };

export default function LoginForm({ searchParams }: LoginFormProps) {
  const { redirectTo = '/drops' } = use(searchParams);
  const router = useRouter();
  const { user, dbUser, setSession } = useAuth();

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULT_VALUES,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRedirectResolved, setGoogleRedirectResolved] = useState(false);

  const showError = useCallback((message: string) => {
    toast.error(message.toUpperCase());
  }, []);

  const resetFormState = useCallback(() => {
    reset(LOGIN_DEFAULT_VALUES);
    setShowPassword(false);
  }, [reset]);

  const { formRef, clearForm } = useAuthFormReset(resetFormState);

  useEffect(() => {
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
    if (!googleRedirectResolved || !user || dbUser || googleLoading || isSubmitting) return;

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
      const resolution = await resolveGoogleRedirectSession('login');
      if (cancelled) return;

      if (resolution.status === 'success') {
        toast.success('WELCOME BACK');
        setSession(resolution.user, resolution.finalized.dbUser);
        router.replace(
          resolveAuthSuccessRedirect({
            mode: 'login',
            redirectTo,
            firstName: resolution.finalized.dbUser.firstName,
            shouldOnboard: false,
          }),
        );
      } else if (resolution.status === 'finalize_error') {
        showError(resolution.finalized.message);
      } else if (
        resolution.status === 'firebase_error' &&
        resolution.code !== 'auth/popup-closed-by-user'
      ) {
        showError(getLoginFirebaseError(resolution.code));
      }

      setGoogleLoading(false);
      setGoogleRedirectResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo, setSession, showError]);

  const handleGoogleSignIn = async () => {
    const normalizedEmail = getValues('email').trim().toLowerCase();

    setGoogleLoading(true);
    try {
      const outcome = await signInWithGoogleInteractive(normalizedEmail);
      if (outcome === 'redirect') return;

      const finalized = await finalizeSession(outcome.user, {
        mode: 'login',
        provider: 'google',
        payload: { email: normalizedEmail },
        deleteCreatedUserOnFailure: shouldDeleteGoogleUserOnFinalizeFailure(outcome),
      });

      if (!finalized.ok) {
        showError(finalized.message);
        return;
      }

      toast.success('WELCOME BACK');
      clearForm();
      setSession(outcome.user, finalized.dbUser);
      router.replace(
        resolveAuthSuccessRedirect({
          mode: 'login',
          redirectTo,
          firstName: finalized.dbUser.firstName,
          shouldOnboard: false,
        }),
      );
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') return;
      showError(getLoginFirebaseError(code));
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { user } = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        values.email,
        values.password,
      );
      const finalized = await finalizeSession(user, {
        mode: 'login',
        provider: 'password',
      });

      if (!finalized.ok) {
        showError(finalized.message);
        return;
      }

      toast.success('WELCOME BACK');
      clearForm();
      setSession(user, finalized.dbUser);
      router.replace(
        resolveAuthSuccessRedirect({
          mode: 'login',
          redirectTo,
          firstName: finalized.dbUser.firstName,
          shouldOnboard: false,
        }),
      );
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';

      // If it's a generic "invalid credentials" error from Firebase,
      // it might be because the account exists but uses a different provider (e.g. Google).
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') {
        try {
          const checkRes = await fetch('/api/users/auth-provider-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: values.email }),
          });

          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.exists && data.authProvider === 'google') {
              showError('This email is registered with Google. Continue with Google sign-in instead.');
              return;
            }
          }
        } catch (checkError) {
          // Fallback to generic error if check fails
          console.error('Provider check failed:', checkError);
        }
      }

      showError(getLoginFirebaseError(code));
    }
  };

  return (
    <AuthPageShell>
      <div className="mb-5 lg:mb-3">
        <div
          className="auth-panel-in mb-3 inline-flex items-center gap-2 lg:mb-2"
          style={{
            background: '#006666',
            color: 'var(--color-tok-cream)',
            fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '2px solid var(--color-tok-black)',
            boxShadow: '3px 3px 0 #262624',
          }}
        >
          WELCOME BACK
        </div>
        <h1
          className="auth-panel-in font-passion font-bold uppercase leading-none text-tok-black"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em', animationDelay: '0.05s' }}
        >
          TAP BACK IN.
        </h1>
        <p className="auth-panel-in mt-2 font-inter text-sm text-tok-black/55 lg:mt-1.5" style={{ animationDelay: '0.1s' }}>
          Don&apos;t have an account?{' '}
          <Link
            href={buildAuthPageHref('/register', redirectTo)}
            className="font-semibold text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
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
        Sign in with Google
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
        <AuthFormField label="Email address" error={errors.email?.message} animClass="auth-panel-in" style={{ animationDelay: '0.25s' }}>
          <input
            {...register('email')}
            type="email"
            autoComplete="off"
            placeholder="Enter your email"
            className={authInputClass}
            aria-invalid={!!errors.email}
          />
        </AuthFormField>

        <AuthFormField label="Password" error={errors.password?.message} animClass="auth-panel-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="off"
              placeholder="Enter your password"
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

        <div className="auth-panel-in flex justify-end lg:pt-0.5" style={{ animationDelay: '0.35s' }}>
          <Link
            href="/forgot-password"
            className="font-inter text-xs font-semibold uppercase tracking-wider text-tok-black/45 transition-colors duration-150 hover:text-tok-teal"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="auth-panel-in flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] active:translate-y-0 active:shadow-none lg:py-3 lg:text-[1.35rem]"
          style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease', opacity: isSubmitting || googleLoading ? 0.6 : 1, cursor: isSubmitting || googleLoading ? 'not-allowed' : 'pointer', animationDelay: '0.4s' }}
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
          {isSubmitting || googleLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span className="animate-fade-in">Processing…</span>
            </>
          ) : (
            'TAP BACK IN'
          )}
        </button>

        <p className="auth-panel-in text-center font-inter text-xs text-tok-black/35 lg:text-[11px]" style={{ animationDelay: '0.45s' }}>

          By signing in, you agree to our{' '}
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
