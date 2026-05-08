'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-tok-cream">
      {/* Top Progress Bar */}
      <div className="fixed top-[60px] left-0 right-0 z-50 h-1.5 overflow-hidden bg-tok-cream border-y-2 border-tok-black/5">
        <div className="h-full w-full bg-tok-teal animate-progress" />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        <div className="animate-fade-in">
          <div className="space-y-4 mb-12">
            <Skeleton className="h-4 w-24 rounded-sm bg-tok-black/10" />
            <Skeleton className="h-16 w-3/4 max-w-[400px] rounded-sm bg-tok-black/5" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl border-[3px] border-tok-black/10 bg-tok-teal/5 shadow-[8px_8px_0px_rgba(0,0,0,0.05)]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-[100px] w-full rounded-xl border-[3px] border-tok-black/10 bg-white/40" />
              <Skeleton className="h-[100px] w-full rounded-xl border-[3px] border-tok-black/10 bg-white/40" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
