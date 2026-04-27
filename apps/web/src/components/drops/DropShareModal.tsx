'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCheck as IconCheckCheck,
  ClipboardCopy as IconClipboard,
  X as IconX,
} from 'lucide-react';

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-t-[28px] border border-[#2a2118]/10 bg-[#F7E9B2] p-5 shadow-[0_32px_80px_rgba(42,33,24,0.22)] sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
              Share drop
            </p>
            <h3 className="mt-1 truncate font-syne text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              {drop.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/10 text-[#2a2118]/40 transition-colors hover:border-[#2a2118]/20 hover:text-[#2a2118]"
          >
            <IconX size={14} />
          </button>
        </div>

        <div className="flex justify-center rounded-[20px] bg-white p-5">
          <QRCodeSVG value={shareUrl} size={180} bgColor="#ffffff" fgColor="#2a2118" level="M" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <div>
            <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
              Join code
            </p>
            <p className="mt-0.5 font-syne text-[24px] font-bold tracking-[0.18em] text-[#2a2118]">
              {drop.joinCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedCode ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#2a2118]/46">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedLink ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
