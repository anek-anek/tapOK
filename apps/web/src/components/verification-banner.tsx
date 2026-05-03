'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface VerificationBannerProps {
  isNavbarVisible?: boolean;
  isMobileMenuOpen?: boolean;
}

export function VerificationBanner({
  isNavbarVisible = true,
  isMobileMenuOpen = false
}: VerificationBannerProps) {
  const { dbUser, isReady, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModals = () => {
      const hasDialog = !!document.querySelector('[role="dialog"], [data-state="open"]');
      setIsModalOpen(hasDialog);
    };

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'class']
    });

    checkModals();
    return () => observer.disconnect();
  }, []);

  if (!isReady || loading || !dbUser || dbUser.isEmailVerified) {
    return null;
  }

  // Hide when mobile menu is open or a modal is active
  const shouldHide = isMobileMenuOpen || isModalOpen;

  return (
    <div
      className={cn(
        "sticky z-30 w-full px-4 pt-6 sm:px-6 transition-all duration-300 ease-in-out",
        isNavbarVisible ? "top-[60px]" : "top-0",
        shouldHide ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-between gap-5 rounded-sm border-[3px] border-tok-black bg-[#323230] p-6 shadow-[6px_6px_0px_#262624] sm:flex-row sm:gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tok-teal shadow-[2px_2px_0px_#1C1C1A]">
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
            href="/profile"
            className="flex h-11 w-full items-center justify-center rounded-sm border-[3px] border-tok-teal bg-tok-teal px-8 font-passion text-sm font-semibold uppercase tracking-[2px] text-tok-cream transition-all hover:-translate-y-0.5 hover:bg-tok-teal-mid hover:shadow-[4px_4px_0px_#262624] sm:w-auto"
          >
            Verify Now
          </Link>
        </div>
      </div>
    </div>
  );
}

