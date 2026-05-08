'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy as IconCopy,
  CheckCheck as IconCheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type DigitalTicketProps = {
  drop: {
    name: string;
    joinCode: string;
    shareUrl: string;
  };
  isMember: boolean;
  className?: string;
  footer?: string;
};

export function DigitalTicket({ drop, isMember, className = '', footer }: DigitalTicketProps) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/drops/join/${drop.joinCode}`
    : drop.shareUrl;

  return (
    <div className={`relative overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A] ${className}`}>
      {/* Ticket header decorative strip */}
      <div className="h-2 w-full bg-tok-teal" />

      <div className="p-6">
        <p className="mb-6 font-passion text-[11px] font-bold uppercase tracking-[4px] text-tok-teal/60">
          {isMember ? 'DIGITAL TICKET' : 'MISSION RESTRICTED'}
        </p>

        {isMember ? (
          <>
            {/* QR Code Container */}
            <div className="relative flex justify-center overflow-hidden rounded-[4px] border-2 border-tok-black bg-tok-cream/30 p-6">
              {/* Decorative corners for QR */}
              <div className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-tok-black" />
              <div className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-tok-black" />
              <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-tok-black" />
              <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-tok-black" />
              <QRCodeSVG value={shareUrl} size={180} bgColor="transparent" fgColor="#1C1C1A" level="H" />
            </div>

            {/* Perforation line decorative separator */}
            <div className="my-8 flex items-center gap-2">
              <div className="h-px flex-1 border-t-2 border-dashed border-tok-black/20" />
              <div className="h-3 w-3 shrink-0 rounded-full border-2 border-tok-black bg-tok-cream" />
              <div className="h-px flex-1 border-t-2 border-dashed border-tok-black/20" />
            </div>

            <div className="space-y-4">
              {/* Join Code Stub */}
              <div className="min-w-0 rounded-[4px] border-2 border-tok-black bg-tok-cream p-4">
                <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  ACCESS CODE
                </p>
                <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 font-passion text-2xl font-bold tracking-[0.12em] text-tok-black break-all sm:text-3xl sm:tracking-[0.2em]">
                    {drop.joinCode}
                  </p>
                  <CopyButton text={drop.joinCode} />
                </div>
              </div>

              {/* Share Link Stub */}
              <div className="mt-4 min-w-0 rounded-[4px] border-2 border-tok-black bg-white p-4">
                <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  SHARE URL
                </p>
                <div className="mt-2 flex min-w-0 items-center gap-3">
                  <span className="min-w-0 flex-1 break-all font-mono text-[10px] font-medium leading-snug text-tok-black/60 sm:break-normal truncate">
                    {shareUrl}
                  </span>
                  <CopyButton text={shareUrl} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-tok-teal-pale text-tok-teal">
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-tok-teal/20" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-10 w-10"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
            <h4 className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
              Boarding Pass Locked
            </h4>
            <p className="mt-3 font-inter text-[13px] leading-relaxed text-tok-black/50">
              Join the crew to unlock your digital ticket, access codes, and mission controls.
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-px border-t-2 border-dashed border-tok-black/10" />
              <p className="mt-4 font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-black/30">
                Awaiting Authorization
              </p>
            </div>
          </div>
        )}

        {footer ? (
          <p className="text-center font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
            {footer}
          </p>
        ) : (
          <p className="mt-4 text-center font-inter text-[10px] font-bold uppercase tracking-widest text-tok-black/20">
            TapOK PROTOCOL v1.0
          </p>
        )}
      </div>

      {/* Bottom decorative notches like a real ticket */}
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-4">
        <div className="h-4 w-6 rounded-t-full border-t-2 border-l-2 border-r-2 border-tok-black bg-tok-cream" />
      </div>
    </div>
  );
}

export function DigitalTicketSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]">
      <div className="h-2 w-full bg-tok-teal" />
      <div className="p-6">
        <Skeleton className="mb-6 h-3 w-40 rounded-sm bg-tok-teal/25" />
        <div className="relative mx-auto mb-8 flex aspect-square w-full max-w-[180px] justify-center overflow-hidden rounded-[4px] border-2 border-tok-black bg-tok-cream/40 p-6">
          <Skeleton className="h-full w-full max-h-[140px] max-w-[140px] rounded-sm bg-tok-black/8" />
        </div>
        <div className="my-8 flex items-center gap-2">
          <div className="h-px flex-1 border-t-2 border-dashed border-tok-black/20" />
          <div className="h-3 w-3 shrink-0 rounded-full border-2 border-tok-black bg-tok-cream" />
          <div className="h-px flex-1 border-t-2 border-dashed border-tok-black/20" />
        </div>
        <div className="space-y-4">
          <div className="min-h-22 w-full rounded-[4px] border-2 border-tok-black bg-tok-cream/60 p-4">
            <Skeleton className="h-2 w-16 bg-tok-black/20" />
            <div className="mt-4 flex justify-between gap-4">
              <Skeleton className="h-8 w-3/4 bg-tok-black/10" />
              <Skeleton className="h-8 w-16 bg-tok-black/10" />
            </div>
          </div>
          <div className="min-h-18 w-full rounded-[4px] border-2 border-tok-black bg-white p-4">
            <Skeleton className="h-2 w-16 bg-tok-black/20" />
            <div className="mt-4 flex justify-between gap-4">
              <Skeleton className="h-4 w-3/4 bg-tok-black/5" />
              <Skeleton className="h-8 w-16 bg-tok-black/10" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-4">
        <div className="h-4 w-6 rounded-t-full border-t-2 border-l-2 border-r-2 border-tok-black bg-tok-cream" />
      </div>
    </div>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 py-1.5 font-passion text-[10px] font-bold uppercase tracking-[1px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none',
        className,
      )}
    >
      {copied ? <IconCheckCheck size={14} strokeWidth={2.5} /> : <IconCopy size={14} strokeWidth={2.5} />}
    </button>
  );
}
