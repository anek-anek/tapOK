'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { finalizeSession } from '@/lib/auth/finalize-session';

const GENERIC_AUTH_ERROR = 'Incorrect email or password.';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

function getFirebaseError(code: string): string {
  return FIREBASE_ERRORS[code] ?? GENERIC_AUTH_ERROR;
}

interface FormFieldProps {
  label: string;
  error?: string;
  animClass?: string;
  children: React.ReactNode;
}

function FormField({ label, error, animClass = '', children }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${animClass}`}>
      <label className="text-sm font-medium text-black/60 transition-colors duration-200">
        {label}
      </label>
      {children}
      {error && <p className="animate-fade-up text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm text-black placeholder-black/25 outline-none transition-all duration-200 ease-in-out focus:border-[#1a6b5e] focus:ring-2 focus:ring-[#1a6b5e]/10 focus:shadow-sm hover:border-black/25';

interface LoginFormProps {
  redirectTo: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { loading } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleGoogleSignIn = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const finalized = await finalizeSession(result.user, { sync: false });

      if (!finalized.ok) {
        setServerError(finalized.message);
        return;
      }

      router.replace(redirectTo);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') return;
      setServerError(getFirebaseError(code));
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, values.email, values.password);
      const finalized = await finalizeSession(user, { sync: false });

      if (!finalized.ok) {
        setServerError(
          finalized.reason === 'no_account'
            ? 'No TapOK account found for this email. Please sign up first.'
            : finalized.message,
        );
        return;
      }

      router.replace(redirectTo);
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
    <div className="flex min-h-screen overflow-hidden">
      {/* ── Left panel ── */}
      <div className="flex w-full flex-col justify-between bg-[#FFF2BD] px-10 py-10 md:w-1/2 lg:px-16">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 self-start transition-opacity duration-200 hover:opacity-70"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black transition-transform duration-200 ease-out group-hover:scale-110">
            <span className="text-xs font-black text-[#FFF2BD]">T</span>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-black">TAPOK</span>
        </Link>

        {/* Form area */}
        <div className="mx-auto w-full max-w-sm py-10">
          <h1 className="animate-fade-up mb-1 text-2xl font-bold text-black">Welcome back</h1>
          <p className="animate-fade-up-1 mb-6 text-sm text-black/50">
            Don&apos;t have an account?{' '}
            <Link
              href={`/register${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="font-semibold text-[#1a6b5e] underline-offset-4 transition-all duration-200 hover:underline"
            >
              Sign up
            </Link>
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
            className="animate-fade-up-2 mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-px hover:border-black/25 hover:shadow-[0_0_0_4px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="animate-fade-up-3 mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-black/30">Or continue with</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField label="Email address" error={errors.email?.message} animClass="animate-fade-up-3">
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className={inputClass}
                aria-invalid={!!errors.email}
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message} animClass="animate-fade-up-4">
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${inputClass} pr-10`}
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
            </FormField>

            <div className="animate-fade-up-5 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-black/40 transition-colors duration-200 hover:text-black"
              >
                Forgot your password?
              </Link>
            </div>

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
              className="animate-fade-up-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a6b5e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#155a4e] hover:shadow-[0_0_0_4px_rgba(26,107,94,0.25)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="animate-fade-in">Signing in…</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <p className="animate-fade-up-7 text-center text-xs text-black/30">
              By signing in, you agree to our{' '}
              <Link href="/" className="underline underline-offset-4 transition-colors duration-200 hover:text-black/60">
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link href="/" className="underline underline-offset-4 transition-colors duration-200 hover:text-black/60">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="animate-fade-in text-xs text-black/25">© 2026 TapOK. Plans that actually happen.</p>
      </div>

      {/* ── Right panel ── */}
      <div
        className="hidden animate-fade-in bg-cover bg-center md:block md:w-1/2"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80')",
        }}
      >
        <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-12">
          <p className="animate-slide-in-right mb-2 text-4xl font-black uppercase leading-tight tracking-tight text-[#FFF2BD]">
            Make Plans.<br />Tap In.<br />Show Up.
          </p>
          <p className="animate-slide-in-right text-sm text-[#FFF2BD]/60">
            One Chief. One Drop. Real plans.
          </p>
        </div>
      </div>
    </div>
  );
}
