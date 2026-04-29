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
      <div className="flex min-h-screen items-center justify-center bg-[#FFF4BD]">
        <Loader2 className="h-6 w-6 animate-spin text-tok-teal" />
      </div>
    );
  }

  return (
    <AuthPageShell>
          {sentTo ? (
            <div className="animate-fade-up flex flex-col gap-5">
              <div
                className="flex h-14 w-14 items-center justify-center bg-tok-teal"
                style={{ border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}
              >
                <MailCheck size={24} className="text-[#FFF4BD]" />
              </div>
              <h1
                className="font-passion font-bold uppercase leading-none text-black"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.01em' }}
              >
                CHECK YOUR INBOX.
              </h1>
              <p className="font-inter text-sm text-black/50">
                We sent a reset link to{' '}
                <span className="font-semibold text-black/70">{sentTo}</span>. Check spam if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="font-passion text-sm uppercase tracking-wider text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="animate-fade-up mb-6">
                <div
                  className="mb-3 inline-flex items-center"
                  style={{
                    background: '#006666',
                    color: '#FFF4BD',
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
                  LOCKED OUT?
                </div>
                <h1
                  className="font-passion font-bold uppercase leading-none text-black"
                  style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.01em' }}
                >
                  RESET YOUR KEY.
                </h1>
                <p className="mt-2 font-inter text-sm text-black/50">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
                <Link
                  href="/login"
                  className="mt-1 inline-block font-inter text-xs font-semibold uppercase tracking-wider text-tok-teal underline-offset-4 transition-colors duration-150 hover:underline"
                >
                  ← Back to sign in
                </Link>
              </div>

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
                  <div
                    className="border-2 border-red-600 bg-red-50 px-4 py-3"
                    style={{ boxShadow: '3px 3px 0 #dc2626' }}
                  >
                    <p className="font-inter text-xs text-red-700">{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  aria-disabled={isSubmitting}
                  onClick={(e) => { if (isSubmitting) e.preventDefault(); }}
                  className="animate-fade-up-3 flex w-full items-center justify-center gap-2 rounded-full bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white active:scale-[0.98]"
                  style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.04)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,102,102,0.38)';
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span className="animate-fade-in">Sending…</span>
                    </>
                  ) : (
                    'SEND RESET LINK'
                  )}
                </button>
              </form>
            </>
          )}
    </AuthPageShell>
  );
}
