'use client';

import { useState, useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useDiscoverData } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import {
  HeroDropCard,
  ListDropCard,
  HeroCardSkeleton,
  ListCardSkeleton,
} from '@/components/drops/drop-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DropCategory } from '@/types/drop';
import { ChevronLeft, ChevronRight, Sparkles, Users } from 'lucide-react';

function DiscoverSkeleton() {
  return (
    <div className="min-h-screen bg-tok-cream text-tok-black">
      <TapokNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-4 w-32 rounded-sm bg-tok-black/10" />
          <Skeleton className="h-14 w-64 rounded-sm bg-tok-black/5" />
          <Skeleton className="h-6 w-full max-w-lg rounded-sm bg-tok-black/5" />
        </div>

        <HeroCardSkeleton />

        <div className="mt-16 space-y-6">
          <Skeleton className="h-8 w-48 rounded-sm bg-tok-black/10" />
          <div className="grid gap-4 sm:grid-cols-2">
            <ListCardSkeleton />
            <ListCardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DiscoverPage() {
  const mounted = useMounted();
  const { dbUser, isReady } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<DropCategory | 'all'>('all');
  const { data, isLoading, isError } = useDiscoverData(page, selectedCategory);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  if (!mounted || !isReady || isLoading) return <DiscoverSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black">
        <TapokNavbar />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-passion text-4xl uppercase">Failed to load discovery</h1>
          <p className="mt-4 text-tok-black/60">We couldn&apos;t fetch the latest drops. Please try again later.</p>
        </main>
      </div>
    );
  }

  const {
    featured = null,
    recentChiefsDrops = [],
    allPublic = { data: [], total: 0, totalPages: 0 }
  } = data || {};

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <TapokNavbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        {/* Hero Text */}
        <div className="mb-12">
          <h1 className="mt-4 font-passion text-[clamp(56px,15vw,100px)] font-black uppercase leading-[0.8] tracking-tighter text-tok-black">
            EXPLORE.
          </h1>
          <p className="mt-6 max-w-md text-[15px] font-bold uppercase tracking-[1px] text-tok-black/40 leading-relaxed">
            FIND YOUR NEXT CREW. JOIN A HANGOUT, HIT A PARTY, OR FOLLOW YOUR FAVORITE CHIEFS.
          </p>
        </div>

        {/* Featured Drop */}
        {featured && (
          <div className="mb-16">
            <div className="mb-4 flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              <Sparkles size={12} className="text-amber-500" />
              Featured Today
            </div>
            <HeroDropCard drop={featured} viewerId={dbUser?.id} />
          </div>
        )}

        {/* Recent Chiefs Section */}
        {recentChiefsDrops.length > 0 && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
                <Users size={14} />
                From Recent Chiefs
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentChiefsDrops.slice(0, 4).map((drop) => (
                <div key={drop.id} className="[&_.mt-4]:mt-0">
                  <ListDropCard drop={drop} viewerId={dbUser?.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories & All Drops */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
            <Sparkles size={14} />
            Public Drops
          </div>

          <div className="flex gap-2">
            {(['all', 'hangout', 'party'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'h-10 rounded-sm border-[3px] border-tok-black px-5 font-passion text-xs font-bold uppercase tracking-[2px] transition-all',
                  selectedCategory === cat
                    ? 'bg-tok-black text-tok-cream shadow-[4px_4px_0px_#1C1C1A]'
                    : 'bg-white text-tok-black hover:bg-tok-black/5'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {allPublic.data.length === 0 && recentChiefsDrops.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-passion text-xl uppercase text-tok-black/40">No drops found in this category</p>
            </div>
          ) : (
            allPublic.data.map((drop) => (
              <ListDropCard key={drop.id} drop={drop} viewerId={dbUser?.id} />
            ))
          )}
        </div>

        {/* Pagination */}
        {allPublic.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
              )}
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>

            <div className="flex h-11 items-center rounded-sm border-[3px] border-tok-black bg-tok-teal px-6 shadow-[6px_6px_0px_#1C1C1A]">
              <span className="font-passion text-sm font-bold uppercase tracking-[2px] text-tok-cream pt-0.5">
                Page {page} of {allPublic.totalPages}
              </span>
            </div>

            <button
              onClick={() => setPage((p) => Math.min(allPublic.totalPages, p + 1))}
              disabled={page === allPublic.totalPages}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
              )}
            >
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
