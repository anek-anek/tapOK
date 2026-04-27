'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Loader2, MailCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthFormField, AuthPageShell, authInputClass } from '@/components/auth/AuthPageShell';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

function getFirebaseError(code: string): string {
  return FIREBASE_ERRORS[code] ?? 'Something went wrong. Please try again.';
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setServerError(null);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSentTo(values.email);
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
          {sentTo ? (
            <div className="animate-fade-up flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a6b5e]/10">
                <MailCheck size={28} className="text-[#1a6b5e]" />
              </div>
              <h1 className="text-[28px] font-bold leading-tight text-black sm:text-3xl">Check your inbox</h1>
              <p className="text-sm text-black/50">
                We sent a password reset link to{' '}
                <span className="font-semibold text-black/70">{sentTo}</span>. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="mt-2 text-sm font-semibold text-[#1a6b5e] underline-offset-4 transition-all duration-200 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="animate-fade-up mb-1 text-[28px] font-bold leading-tight text-black sm:text-3xl">
                Reset your password
              </h1>
              <p className="animate-fade-up-1 mb-1 text-sm text-black/50">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <Link
                href="/login"
                className="animate-fade-up-1 mb-6 inline-block text-sm font-semibold text-[#1a6b5e] underline-offset-4 transition-all duration-200 hover:underline"
              >
                Back to sign in
              </Link>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <AuthFormField label="Email address" error={errors.email?.message} animClass="animate-fade-up-2">
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
                  <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
                    <p className="text-xs text-red-700">{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="animate-fade-up-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a6b5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#155a4e] hover:shadow-[0_0_0_4px_rgba(26,107,94,0.25)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span className="animate-fade-in">Sending…</span>
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>
            </>
          )}
    </AuthPageShell>
  );
}
