'use client';

import React from 'react';
import { Zap, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalSliderProps {
  onBoost: () => void;
  onJam: () => void;
  currentVote: number; // 1, -1, or 0
  score: number;
  className?: string;
}

export function SignalSlider({ onBoost, onJam, currentVote, score, className }: SignalSliderProps) {
  const isBoosted = currentVote === 1;
  const isJammed = currentVote === -1;

  return (
    <div className={cn('mt-4 flex gap-2', className)}>
      {/* Boost Button */}
      <button
        onClick={onBoost}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-sm border-[3px] py-3 font-passion text-xs font-black uppercase tracking-[2px] transition-all',
          isBoosted
            ? 'border-tok-teal bg-tok-teal text-tok-cream shadow-[3px_3px_0px_#006666] hover:brightness-105'
            : 'border-tok-black/20 bg-tok-cream text-tok-black/40 hover:border-tok-teal hover:text-tok-teal hover:bg-tok-teal/5'
        )}
      >
        <Zap size={14} strokeWidth={2.5} className={isBoosted ? 'fill-current' : ''} />
        Boost
      </button>

      {/* Score */}
      <div className={cn(
        'flex min-w-[52px] items-center justify-center rounded-sm border-[3px] font-passion text-xl font-black italic tracking-tighter',
        isBoosted ? 'border-tok-teal bg-tok-teal/10 text-tok-teal' :
        isJammed ? 'border-red-400 bg-red-50 text-red-600' :
        'border-tok-black/10 bg-white text-tok-black/40'
      )}>
        {score > 0 ? `+${score}` : score === 0 ? '0' : score}
      </div>

      {/* Jam Button */}
      <button
        onClick={onJam}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-sm border-[3px] py-3 font-passion text-xs font-black uppercase tracking-[2px] transition-all',
          isJammed
            ? 'border-red-500 bg-red-500 text-white shadow-[3px_3px_0px_#991b1b] hover:brightness-105'
            : 'border-tok-black/20 bg-tok-cream text-tok-black/40 hover:border-red-400 hover:text-red-500 hover:bg-red-50'
        )}
      >
        <ShieldOff size={14} strokeWidth={2.5} />
        Jam
      </button>
    </div>
  );
}
