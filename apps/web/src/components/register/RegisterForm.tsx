'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signUpSchema, type SignUpFormValues } from '@/lib/validations/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { finalizeSession } from '@/lib/auth/finalize-session';
import { AuthFormField, AuthPageShell, authInputClass } from '@/components/auth/AuthPageShell';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

function getFirebaseError(code: string): string {
  return FIREBASE_ERRORS[code] ?? 'Something went wrong. Please try again.';
}

interface RegisterFormProps {
  redirectTo: string;
}

export default function RegisterForm({ redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const { loading, setSession } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.classList.remove('animate-shake');
      void errorRef.current.offsetWidth;
      errorRef.current.classList.add('animate-shake');
    }
  }, [serverError]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const finalized = await finalizeSession(result.user, { sync: true });

      if (!finalized.ok) {
        setServerError(finalized.message);
        return;
      }

      setSession(result.user, finalized.dbUser);

      const isCrewJoin = redirectTo.startsWith('/drops/join/');
      if (isCrewJoin) {
        router.replace(redirectTo);
      } else {
        router.replace(`/onboarding?name=${encodeURIComponent(finalized.dbUser.firstName)}`);
      }
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        setServerError(getFirebaseError(code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (values: SignUpFormValues) => {
    setServerError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const finalized = await finalizeSession(user, {
        sync: true,
        payload: { firstName: values.firstName.trim(), lastName: values.lastName.trim() },
      });

      if (!finalized.ok) {
        setServerError(finalized.message);
        return;
      }

      setSession(user, finalized.dbUser);

      const isCrewJoin = redirectTo.startsWith('/drops/join/');
      if (isCrewJoin) {
        router.replace(redirectTo);
      } else {
        router.replace(`/onboarding?name=${encodeURIComponent(values.firstName.trim())}`);
      }
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      setServerError(getFirebaseError(code));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF2BD]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a6b5e]" />
      </div>
    );
  }

  return (
    <AuthPageShell>
          <h1 className="animate-fade-up mb-1 text-[28px] font-bold leading-tight text-black sm:text-3xl">Create account</h1>
          <p className="animate-fade-up-1 mb-6 text-sm text-black/50">
            Already have an account?{' '}
            <Link
              href={`/login${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="font-semibold text-[#1a6b5e] underline-offset-4 transition-all duration-200 hover:underline"
            >
              Sign in
            </Link>
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || isSubmitting}
            className="animate-fade-up-2 mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-medium text-black shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-px hover:border-black/25 hover:shadow-[0_0_0_4px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="animate-fade-up-3 mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-black/30">Or continue with</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="animate-fade-up-3 flex flex-col gap-4 sm:flex-row sm:gap-3">
              <AuthFormField label="First name" error={errors.firstName?.message}>
                <input
                  {...register('firstName')}
                  type="text"
                  autoComplete="given-name"
                  placeholder="Sean"
                  className={authInputClass}
                  aria-invalid={!!errors.firstName}
                />
              </AuthFormField>
              <AuthFormField label="Last name" error={errors.lastName?.message}>
                <input
                  {...register('lastName')}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Aguilar"
                  className={authInputClass}
                  aria-invalid={!!errors.lastName}
                />
              </AuthFormField>
            </div>

            <AuthFormField label="Email address" error={errors.email?.message} animClass="animate-fade-up-4">
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={authInputClass}
                aria-invalid={!!errors.email}
              />
            </AuthFormField>

            <AuthFormField label="Password" error={errors.password?.message} animClass="animate-fade-up-5">
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  className={`${authInputClass} pr-10`}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 transition-all duration-150 hover:scale-110 hover:text-black/60"
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

            <AuthFormField label="Confirm password" error={errors.confirmPassword?.message} animClass="animate-fade-up-6">
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`${authInputClass} pr-10`}
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 transition-all duration-150 hover:scale-110 hover:text-black/60"
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

            {serverError && (
              <div
                ref={errorRef}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-3"
              >
                <p className="text-xs text-red-700">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="animate-fade-up-7 mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a6b5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#155a4e] hover:shadow-[0_0_0_4px_rgba(26,107,94,0.25)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="animate-fade-in">Creating account…</span>
                </>
              ) : (
                'Tap In'
              )}
            </button>

            <p className="animate-fade-up-7 text-center text-xs text-black/30">
              By signing up, you agree to our{' '}
              <Link href="/" className="underline underline-offset-4 transition-colors duration-200 hover:text-black/60">
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link href="/" className="underline underline-offset-4 transition-colors duration-200 hover:text-black/60">
                Privacy Policy
              </Link>
            </p>
          </form>
    </AuthPageShell>
  );
}
