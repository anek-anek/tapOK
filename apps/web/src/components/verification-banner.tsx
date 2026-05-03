'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export function VerificationBanner() {
  const { dbUser, isReady, loading } = useAuth();

  if (!isReady || loading || !dbUser || dbUser.isEmailVerified) {
    return null;
  }

  return (
    <div className="relative z-40 w-full px-4 pt-6 sm:px-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="mx-auto max-w-4xl">
        <div className="group flex flex-col items-center justify-between gap-5 rounded-sm border-[3px] border-tok-black bg-[#323230] p-6 shadow-[6px_6px_0px_#262624] transition-all hover:shadow-[8px_8px_0px_#14B8A6] sm:flex-row sm:gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tok-teal shadow-[2px_2px_0px_#1C1C1A] group-hover:animate-pulse">
              <ShieldAlert size={24} className="text-tok-cream" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="font-passion text-base font-bold uppercase tracking-[2px] text-tok-cream/90">
                Account Restricted
              </p>
              <p className="mt-0.5 font-inter text-sm font-medium leading-tight text-white/70">
                Your crew status is pending verification.
              </p>
            </div>
          </div>
          <Link
            href="/profile?verify=true"
            className="flex h-11 w-full items-center justify-center rounded-sm border-[3px] border-tok-cream bg-tok-cream px-8 font-passion text-sm font-semibold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#14B8A6] active:translate-y-0 active:shadow-none sm:w-auto"
          >
            Verify Now
          </Link>
        </div>
      </div>
    </div>
  );
}
