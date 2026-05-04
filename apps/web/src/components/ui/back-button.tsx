'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  label?: string;
}

export function BackButton({ className, label = 'Back' }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider border-2 border-tok-black bg-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(38,38,36,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all",
        className
      )}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
