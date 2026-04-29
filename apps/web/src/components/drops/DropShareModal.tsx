'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCheck as IconCheckCheck,
  ClipboardCopy as IconClipboard,
  X as IconX,
} from 'lucide-react';
import { ModalShell } from '@/components/modal-shell';

type DropShareModalProps = {
  drop: {
    name: string;
    shareUrl: string;
    joinCode: string;
  };
  onClose: () => void;
};

export function DropShareModal({ drop, onClose }: DropShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/drops/join/${drop.joinCode}`
      : drop.shareUrl;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return;
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(drop.joinCode);
    } catch {
      return;
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <div className="flex flex-col overflow-hidden rounded-[28px] bg-tok-cream shadow-2xl">
          {/* Header Section - TapOK Teal */}
          <div className="relative bg-tok-teal px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-passion text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
                  Official Drop
                </p>
                <h3 className="mt-0.5 font-passion text-[28px] leading-none font-bold uppercase tracking-tight text-white sm:text-[34px]">
                  {drop.name}
                </h3>
              </div>
              <button
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Ticket Notches */}
            <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-8">
              <div className="h-6 w-6 rounded-full bg-tok-cream" />
              <div className="h-6 w-6 rounded-full bg-tok-cream" />
            </div>
          </div>

          {/* Body Section - Brand Cream */}
          <div className="p-5 pt-8 sm:p-8 sm:pt-10">
            <div className="flex flex-col items-center">
              {/* QR Code Container */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-[28px] bg-tok-black/5" />
                <div className="relative overflow-hidden rounded-[24px] border border-tok-black/5 bg-white p-6 shadow-lg sm:p-7">
                  <QRCodeSVG
                    value={shareUrl}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <p className="mt-4 font-passion text-[12px] font-bold uppercase tracking-[0.2em] text-tok-black/40">
                Scan to join
              </p>
            </div>

            {/* Divider Line */}
            <div className="my-6 h-[1.5px] w-full bg-tok-black/5" />

            {/* Join Code Section */}
            <div className="space-y-3">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center rounded-[20px] bg-white px-6 py-4 shadow-sm">
                  <p className="font-passion text-[10px] font-bold uppercase tracking-[0.25em] text-tok-black/30">
                    Join Code
                  </p>
                  <p className="mt-0.5 font-passion text-[36px] font-bold tracking-[0.18em] text-tok-black">
                    {drop.joinCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="group flex h-auto items-center justify-center gap-2 rounded-[20px] bg-tok-teal px-8 py-4 font-passion text-[14px] font-bold uppercase tracking-widest text-white transition-all hover:bg-tok-teal-mid active:scale-95 sm:flex-col sm:gap-0"
                >
                  {copiedCode ? <IconCheckCheck size={20} /> : <IconClipboard size={20} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* URL Field */}
              <div className="flex items-center mt-4 gap-2 rounded-[18px] border border-tok-black/5 bg-tok-cream-dim/40 p-3">
                <span className="min-w-0 flex-1 truncate font-inter text-[12px] font-medium text-tok-black/50">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-white px-4 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-sm transition-all hover:shadow-md active:scale-95"
                >
                  {copiedLink ? <IconCheckCheck size={14} /> : <IconClipboard size={14} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-tok-black/1 py-3 text-center">
            <p className="font-inter text-[11px] font-medium text-tok-black/30">
              Only share this with people you want in the drop.
            </p>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
