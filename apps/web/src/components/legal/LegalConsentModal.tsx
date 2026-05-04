'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { usersService } from '@/services/users.service';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck, X, ChevronDown } from 'lucide-react';
import { TermsContent } from './TermsContent';
import { PrivacyContent } from './PrivacyContent';
import { PUBLIC_ROUTES } from '@/lib/constants/routes';

export function LegalConsentModal() {
  const pathname = usePathname();
  const { dbUser, isReady, loading, refreshUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReady && !loading) {
      const timer = setTimeout(() => setHasSettled(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, loading]);

  useEffect(() => {
    if (!isReady || loading || !hasSettled || !dbUser) {
      setIsVisible(false);
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.some((route) => {
      if (route === '/') return pathname === '/';
      return pathname === route || pathname.startsWith(`${route}/`);
    });

    if (isPublicRoute) {
      setIsVisible(false);
      return;
    }

    const hasAccepted = !!(dbUser.privacyPolicyAccepted && dbUser.termsAccepted);
    if (hasAccepted) {
      setIsVisible(false);
      return;
    }

    const isDismissed = sessionStorage.getItem('tapok_legal_dismissed') === 'true';
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  }, [dbUser, isReady, pathname]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Using a 50px buffer for better UX
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('tapok_legal_dismissed', 'true');
    setIsVisible(false);
  };

  const handleAccept = async () => {
    if (!dbUser || !hasScrolledToBottom) return;
    setIsAccepting(true);

    try {
      const now = new Date().toISOString();
      // Using the correct field names that match the backend DTO and DB schema
      await usersService.update(dbUser.id, {
        termsAccepted: true,
        termsAcceptedAt: now,
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: now,
      });

      toast.success('PREFERENCES UPDATED');
      await refreshUser();
      setIsVisible(false);
    } catch (error) {
      toast.error('FAILED TO UPDATE PREFERENCES');
      console.error('Legal acceptance failed:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-tok-black/60 backdrop-blur-md transition-opacity duration-300" />

      {/* Modal */}
      <div
        className="auth-panel-in relative flex flex-col w-full max-w-3xl max-h-[90vh] border-4 border-tok-black bg-tok-cream shadow-[12px_12px_0px_0px_#262624]"
        style={{ animationDuration: '0.4s' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-4 border-tok-black bg-tok-teal p-4 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="drop-shadow-sm" />
            <div>
              <h2 className="font-passion text-2xl uppercase tracking-wider leading-none">Legal Compliance</h2>
              <p className="font-inter text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1">Review & Acceptance Required</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 transition-all hover:bg-white/20 active:scale-95"
            aria-label="Dismiss"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white/50 scroll-smooth"
        >
          <div className="max-w-2xl mx-auto">
            <div className="mb-12">
              <div className="inline-block bg-tok-yellow px-4 py-1 border-2 border-tok-black font-passion text-lg uppercase mb-4 shadow-[4px_4px_0px_0px_#262624]">
                1. Terms & Conditions
              </div>
              <TermsContent />
            </div>

            <div className="h-[2px] w-full bg-tok-black/10 my-16" />

            <div className="mb-8">
              <div className="inline-block bg-tok-teal px-4 py-1 border-2 border-tok-black font-passion text-lg uppercase mb-4 shadow-[4px_4px_0px_0px_#262624] text-white">
                2. Privacy Policy
              </div>
              <PrivacyContent />
            </div>

            {/* Scroll Indicator at the end of content */}
            {!hasScrolledToBottom && (
              <div className="mt-10 flex flex-col items-center gap-2 text-tok-teal animate-bounce">
                <p className="font-passion text-sm uppercase tracking-widest">Scroll to end to accept</p>
                <ChevronDown size={20} />
              </div>
            )}
          </div>
        </div>

        {/* Actions - Sticky Footer */}
        <div className="shrink-0 flex flex-col border-t-4 border-tok-black bg-tok-cream p-4 sm:p-6 sm:flex-row sm:gap-4 items-center justify-center">
          <div className="flex-1 mb-4 sm:mb-0 text-center sm:text-left">
            <p className="font-inter text-[11px] leading-relaxed text-tok-black/60">
              By clicking "Accept & Continue", you confirm that you have read and agree to both the Terms & Conditions and the Privacy Policy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleDismiss}
              disabled={isAccepting}
              className="w-full sm:w-auto rounded-lg border-2 border-tok-black bg-white px-6 py-3 font-passion text-xl uppercase tracking-wider text-tok-black transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#262624] active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              Later
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepting || !hasScrolledToBottom}
              title={!hasScrolledToBottom ? "Please scroll to the bottom to accept" : ""}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border-2 border-tok-black px-8 py-3 font-passion text-xl sm:text-2xl uppercase tracking-wider text-white transition-all active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${hasScrolledToBottom
                ? 'bg-tok-teal shadow-none hover:-translate-y-1.5 hover:-translate-x-1.5 hover:shadow-[9px_9px_0px_0px_#262624]'
                : 'bg-tok-black/20 shadow-none'
                }`}
            >
              {isAccepting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                'Accept & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
