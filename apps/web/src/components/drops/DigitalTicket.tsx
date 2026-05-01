'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy as IconCopy,
  CheckCheck as IconCheckCheck,
  Share2 as IconShare2,
} from 'lucide-react';

type DigitalTicketProps = {
  drop: {
    name: string;
    joinCode: string;
    shareUrl: string;
  };
  className?: string;
  footer?: string;
};

export function DigitalTicket({ drop, className = '', footer }: DigitalTicketProps) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/drops/join/${drop.joinCode}`
    : drop.shareUrl;

  return (
    <div className={`relative overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A] ${className}`}>
      {/* Ticket header decorative strip */}
      <div className="h-2 w-full bg-tok-teal" />

      <div className="p-6">
        <p className="mb-6 font-passion text-[11px] font-bold uppercase tracking-[4px] text-tok-teal/60">
          DIGITAL TICKET
        </p>

        {/* QR Code Container */}
        <div className="relative mb-8 flex justify-center overflow-hidden rounded-[4px] border-2 border-tok-black bg-tok-cream/30 p-6">
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
          <div className="rounded-[4px] border-2 border-tok-black bg-tok-cream p-4">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              ACCESS CODE
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-passion text-3xl font-bold tracking-[0.2em] text-tok-black">
                {drop.joinCode}
              </p>
              <CopyButton text={drop.joinCode} />
            </div>
          </div>

          {/* Share Link Stub */}
          <div className="rounded-[4px] border-2 border-tok-black bg-white p-4">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              SHARE URL
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-medium text-tok-black/60">
                {shareUrl}
              </span>
              <CopyButton text={shareUrl} />
            </div>
          </div>
        </div>

        {footer ? (
          <p className="mt-8 text-center font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
            {footer}
          </p>
        ) : (
          <p className="mt-6 text-center font-inter text-[10px] font-bold uppercase tracking-widest text-tok-black/20">
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

function CopyButton({ text }: { text: string }) {
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
      className="inline-flex shrink-0 items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 py-1.5 font-passion text-[10px] font-bold uppercase tracking-[1px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
    >
      {copied ? <IconCheckCheck size={14} strokeWidth={2.5} /> : <IconCopy size={14} strokeWidth={2.5} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
