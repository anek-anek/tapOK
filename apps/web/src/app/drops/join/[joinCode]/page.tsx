'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropByJoinCode } from '@/hooks/queries/use-drops';

export default function JoinDropPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = React.use(params);
  const router = useRouter();
  const { data: drop, isError } = useDropByJoinCode(joinCode);

  useEffect(() => {
    if (drop) {
      router.replace(`/drops/${drop.id}`);
    }
  }, [drop, router]);

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/60">Drop not found or the link has expired.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
      <div className="text-center">
        <div className="mx-auto h-1.5 w-20 animate-pulse rounded-full bg-[#2a2118]/15" />
        <p className="mt-4 font-mono text-xs text-[#2a2118]/40">Looking up drop…</p>
      </div>
    </div>
  );
}
