'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export const authInputClass =
  'w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm text-black placeholder-black/25 outline-none transition-all duration-200 ease-in-out focus:border-[#1a6b5e] focus:ring-2 focus:ring-[#1a6b5e]/10 focus:shadow-sm hover:border-black/25';

type AuthFormFieldProps = {
  label: string;
  error?: string;
  animClass?: string;
  children: ReactNode;
};

export function AuthFormField({ label, error, animClass = '', children }: AuthFormFieldProps) {
  return (
    <div className={`flex w-full flex-col gap-1.5 ${animClass}`}>
      <label className="text-sm font-medium text-black/60 transition-colors duration-200">
        {label}
      </label>
      {children}
      {error && <p className="animate-fade-up text-xs text-red-600">{error}</p>}
    </div>
  );
}

type AuthPageShellProps = {
  children: ReactNode;
  footerClassName?: string;
};

export function AuthPageShell({ children, footerClassName = 'animate-fade-in' }: AuthPageShellProps) {
  return (
    <div className="flex min-h-dvh bg-[#FFF2BD] lg:min-h-screen">
      <div className="flex w-full flex-col justify-between gap-8 bg-[#FFF2BD] px-5 py-6 sm:px-8 sm:py-8 lg:w-1/2 lg:px-16 lg:py-10">
        <Link
          href="/"
          className="group flex items-center gap-2 self-start transition-opacity duration-200 hover:opacity-70"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black transition-transform duration-200 ease-out group-hover:scale-110">
            <span className="text-xs font-black text-[#FFF2BD]">T</span>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-black">TAPOK</span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6 sm:max-w-md sm:py-10">
          {children}
        </div>

        <p className={`${footerClassName} text-xs text-black/25`.trim()}>
          © 2026 TapOK. Plans that actually happen.
        </p>
      </div>

      <div
        className="hidden animate-fade-in bg-cover bg-center lg:block lg:w-1/2"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80')",
        }}
      >
        <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-10 xl:p-12">
          <p className="animate-slide-in-right mb-2 text-4xl font-black uppercase leading-tight tracking-tight text-[#FFF2BD] xl:text-5xl">
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
