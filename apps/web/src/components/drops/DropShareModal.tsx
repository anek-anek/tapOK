'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCheck as IconCheckCheck,
  ClipboardCopy as IconClipboard,
  X as IconX,
} from 'lucide-react';
import { ModalShell } from '@/components/modal-shell';
import { Button } from '@/components/ui/button';

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
        <div className="bg-[#F7E9B2] p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                Share drop
              </p>
              <h3 className="mt-1 truncate font-passion text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
                {drop.name}
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={close}
              className="mt-0.5 shrink-0 rounded-full border-[#2a2118]/12 bg-transparent text-[#2a2118]/36 hover:border-[#2a2118]/22 hover:bg-white/50 hover:text-[#2a2118]"
            >
              <IconX size={14} />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="flex justify-center rounded-[20px] bg-white p-5">
            <QRCodeSVG value={shareUrl} size={180} bgColor="#ffffff" fgColor="#2a2118" level="M" />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
            <div>
              <p className="font-passion text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                Join code
              </p>
              <p className="mt-0.5 font-passion text-[24px] font-bold tracking-[0.18em] text-[#2a2118]">
                {drop.joinCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
            >
              {copiedCode ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
            <span className="min-w-0 flex-1 truncate font-inter text-[12px] text-[#2a2118]/46">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
            >
              {copiedLink ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
