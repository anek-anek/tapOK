'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, LockKeyhole, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

import {
  AuthFormField,
  AuthPageShell,
  authInputClass,
} from '@/components/auth/AuthPageShell';
import { useAuthFormReset } from '@/lib/auth/use-auth-form-reset';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth';
import { authClient } from '@/lib/auth-client';

const DEFAULT_VALUES: ResetPasswordFormValues = {
  newPassword: '',
  confirmNewPassword: '',
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetFormState = useCallback(() => {
    reset(DEFAULT_VALUES);
    setShowNew(false);
    setShowConfirm(false);
  }, [reset]);

  const { formRef } = useAuthFormReset(resetFormState);

  useEffect(() => {
    if (!token) {
      setError('INVALID OR EXPIRED RESET LINK');
    }
  }, [token]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;

    const result = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (result.error) {
      toast.error((result.error.message ?? 'Something went wrong. Please try again.').toUpperCase());
      return;
    }

    setSuccess(true);
    toast.success('PASSWORD UPDATED');
  };

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
              {error}. Please request a new password reset link.
            </p>
          </div>

          <div className="auth-panel-in" style={{ animationDelay: '0.1s' }}>
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      {success ? (
        <div className="flex flex-col gap-6 lg:gap-5">
          <div className="auth-panel-in">
            <div
              className="mb-3 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-black px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#006666]"
              style={{ animationDelay: '0.05s' }}
            >
              <CheckCircle2 size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                SECURITY UPDATED
              </span>
            </div>

            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-tok-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_0px_#262624] lg:mb-3 lg:h-14 lg:w-14">
              <LockKeyhole size={32} />
            </div>

            <h1
              className="font-passion font-bold uppercase leading-none text-tok-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em' }}
            >
              PASSWORD CHANGED.
            </h1>

            <p className="mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]">
              Your password has been reset successfully. You can now sign in with your new credentials.
            </p>
          </div>

          <div className="auth-panel-in" style={{ animationDelay: '0.1s' }}>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#005555] hover:shadow-[8px_8px_0px_0px_#262624] active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
            >
              Sign In to TapOK
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 lg:mb-4">
            <div
              className="auth-panel-in mb-3 inline-flex items-center gap-2 border-2 border-tok-black bg-tok-teal px-3 py-1 text-tok-cream shadow-[3px_3px_0px_0px_#262624] lg:mb-2"
              style={{ animationDelay: '0.05s' }}
            >
              <LockKeyhole size={14} />
              <span className="font-passion text-[10px] uppercase tracking-[0.18em]">
                NEW ACCESS
              </span>
            </div>

            <h1
              className="auth-panel-in font-passion font-bold uppercase leading-none text-tok-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.01em', animationDelay: '0.1s' }}
            >
              RESET PASSWORD.
            </h1>

            <p
              className="auth-panel-in mt-3 max-w-sm font-inter text-sm leading-relaxed text-tok-black/55 lg:mt-2 lg:text-[13px]"
              style={{ animationDelay: '0.15s' }}
            >
              Set a new password to regain access to your TapOK account.
            </p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
            className="flex flex-col gap-5 lg:gap-4"
          >
            <AuthFormField
              label="New Password"
              error={errors.newPassword?.message}
              animClass="auth-panel-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="relative">
                <input
                  {...register('newPassword')}
                  type={showNew ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-tok-black/35 transition-colors hover:text-tok-teal"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthFormField>

            <AuthFormField
              label="Confirm New Password"
              error={errors.confirmNewPassword?.message}
              animClass="auth-panel-in"
              style={{ animationDelay: '0.25s' }}
            >
              <div className="relative">
                <input
                  {...register('confirmNewPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-tok-black/35 transition-colors hover:text-tok-teal"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </AuthFormField>

            <div className="auth-panel-in mt-2" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="tapok-btn flex w-full items-center justify-center gap-2 rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] lg:py-3 lg:text-[1.35rem]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
