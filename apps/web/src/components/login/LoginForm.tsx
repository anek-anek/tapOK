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
import { AuthFormField, AuthPageShell, authInputClass } from '@/components/auth/AuthPageShell';
import { toast } from 'react-hot-toast';

const GENERIC_AUTH_ERROR = 'Incorrect email or password.';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

function getFirebaseError(code: string): string {
  return FIREBASE_ERRORS[code] ?? GENERIC_AUTH_ERROR;
}

interface LoginFormProps {
  redirectTo: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { loading, setSession } = useAuth();

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
        const msg = Array.isArray(finalized.message) ? finalized.message[0] : finalized.message;
        toast.error(String(msg).toUpperCase());
        return;
      }

      toast.success('WELCOME BACK');
      setSession(result.user, finalized.dbUser);
      router.replace(redirectTo);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') return;
      toast.error(String(getFirebaseError(code)).toUpperCase());
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
        const msg = finalized.reason === 'no_account'
          ? 'No TapOK account found for this email. Please sign up first.'
          : finalized.message;
        const displayMsg = Array.isArray(msg) ? msg[0] : msg;
        toast.error(String(displayMsg).toUpperCase());
        return;
      }

      toast.success('WELCOME BACK');
      setSession(user, finalized.dbUser);
      router.replace(redirectTo);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      toast.error(String(getFirebaseError(code)).toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tok-cream">
        <Loader2 className="h-6 w-6 animate-spin text-tok-teal" />
      </div>
    );
  }

  return (
    <AuthPageShell>
      <div className="animate-fade-up mb-6">
        <div
          className="mb-3 inline-flex items-center gap-2"
          style={{
            background: '#006666',
            color: 'var(--color-tok-cream)',
            fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '2px solid #000',
            boxShadow: '3px 3px 0 #000',
          }}
        >
          WELCOME BACK
        </div>
        <h1
          className="font-passion font-bold uppercase leading-none text-black"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
        >
          TAP BACK IN.
        </h1>
        <p className="mt-2 font-inter text-sm text-black/50">
          Don&apos;t have an account?{' '}
          <Link
            href={`/register${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
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
        className="animate-fade-up-2 mb-5 flex w-full items-center justify-center gap-3 border-2 border-black bg-white px-5 py-3 font-inter text-sm font-medium text-black transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: '4px 4px 0 #000', borderRadius: 0 }}
        onMouseEnter={(e) => {
          if (!googleLoading && !isSubmitting) {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #000';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #000';
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
      <div className="animate-fade-up-3 mb-5 flex items-center gap-3">
        <div className="h-[2px] flex-1 bg-black/10" />
        <span className="font-passion text-xs uppercase tracking-[0.12em] text-black/30">Or continue with</span>
        <div className="h-[2px] flex-1 bg-black/10" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AuthFormField label="Email address" error={errors.email?.message} animClass="animate-fade-up-3">
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className={authInputClass}
            aria-invalid={!!errors.email}
          />
        </AuthFormField>

        <AuthFormField label="Password" error={errors.password?.message} animClass="animate-fade-up-4">
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        <div className="animate-fade-up-5 flex justify-end">
          <Link
            href="/forgot-password"
            className="font-inter text-xs font-semibold uppercase tracking-wider text-black/40 transition-colors duration-150 hover:text-tok-teal"
          >
            Forgot password?
          </Link>
        </div>


        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="animate-fade-up-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] active:translate-y-0 active:shadow-none"
          style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease', opacity: isSubmitting || googleLoading ? 0.6 : 1, cursor: isSubmitting || googleLoading ? 'not-allowed' : 'pointer' }}
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
              <span className="animate-fade-in">Signing in…</span>
            </>
          ) : (
            'TAP BACK IN'
          )}
        </button>

        <p className="animate-fade-up-7 text-center font-inter text-xs text-black/30">
          By signing in, you agree to our{' '}
          <Link href="/" className="underline underline-offset-4 transition-colors duration-150 hover:text-black/60">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/" className="underline underline-offset-4 transition-colors duration-150 hover:text-black/60">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
