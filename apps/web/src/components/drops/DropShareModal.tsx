'use client';

import { X as IconX } from 'lucide-react';
import { ModalShell } from '@/components/modal-shell';
import { DigitalTicket } from './DigitalTicket';

type DropShareModalProps = {
  drop: {
    name: string;
    shareUrl: string;
    joinCode: string;
  };
  onClose: () => void;
};

export function DropShareModal({ drop, onClose }: DropShareModalProps) {
  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <div className="relative w-full max-w-sm mx-auto p-4 rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[10px_10px_0px_#1C1C1A]">
          {/* Close button - Top Right */}
          <button
            onClick={close}
            className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none z-50 shadow-[2px_2px_0px_#1C1C1A]"
          >
            <IconX size={20} strokeWidth={2.5} />
          </button>
          
          <DigitalTicket 
            drop={drop} 
            footer="Share this ticket with your crew"
          />
        </div>
      )}
    </ModalShell>
  );
}
