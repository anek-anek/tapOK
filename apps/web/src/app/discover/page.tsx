'use client';

import { useState, useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { TapokNavbar } from '@/components/tapok-navbar';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
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

function DiscoverDotGrid() {
  return (
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }}
    />
  );
}

function DiscoverHeroStatus({
  isPlaceholderData,
  publicTotal,
}: {
  isPlaceholderData: boolean;
  publicTotal: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 self-start rounded-sm border-[3px] border-tok-black bg-white px-5 py-2.5 font-passion text-[14px] font-black uppercase tracking-wider text-tok-black shadow-[4px_4px_0px_#1C1C1A] sm:self-auto">
      <span className="relative flex h-3 w-3">
        {isPlaceholderData ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tok-teal opacity-75" />
        ) : null}
        <span className="relative inline-flex h-3 w-3 rounded-full bg-tok-teal" />
      </span>
      {isPlaceholderData
        ? 'Updating feed…'
        : publicTotal > 0
          ? `${publicTotal} public drop${publicTotal === 1 ? '' : 's'}`
          : 'Public feed'}
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <DiscoverDotGrid />
      <TapokNavbar />
      <PageBackdropWatermark label="DISCOVER" />
      <main className="relative z-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        {/* Hero — mirrors headline + status pill */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-36 rounded-sm bg-tok-black/10" />
            <Skeleton className="mt-4 h-[clamp(52px,11vw,84px)] w-[min(92vw,340px)] rounded-sm bg-tok-black/10" />
          </div>
          <Skeleton className="h-[52px] w-full max-w-[240px] shrink-0 rounded-sm border-[3px] border-tok-black/15 bg-white shadow-[4px_4px_0px_rgba(28,28,26,0.12)] sm:max-w-[280px]" />
        </div>

        {/* Featured Today — same header row as loaded state */}
        <div className="mb-16">
          <div className="mb-4 flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
            <Sparkles size={12} className="text-amber-500" />
            Featured Today
          </div>
          <HeroCardSkeleton />
        </div>

        {/* From Recent Chiefs — 2×2 grid like slice(0, 4) */}
        <div className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
              <Users size={14} />
              From Recent Chiefs
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="[&_.mt-4]:mt-0">
                <ListCardSkeleton />
              </div>
            ))}
          </div>
        </div>

        {/* Public Drops + category filters */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
            <Sparkles size={14} />
            Public Drops
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 min-w-[52px] rounded-sm border-[3px] border-tok-black/25 bg-white shadow-[2px_2px_0px_rgba(28,28,26,0.15)]" />
            <Skeleton className="h-10 min-w-[84px] rounded-sm border-[3px] border-tok-black/25 bg-white shadow-[2px_2px_0px_rgba(28,28,26,0.15)]" />
            <Skeleton className="h-10 min-w-[68px] rounded-sm border-[3px] border-tok-black/25 bg-white shadow-[2px_2px_0px_rgba(28,28,26,0.15)]" />
          </div>
        </div>

        {/* Single-column list — matches allPublic list (space-y-4) */}
        <div className="space-y-4">
          <ListCardSkeleton />
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      </main>
    </div>
  );
}

function PublicDropsListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading public drops">
      <ListCardSkeleton />
      <ListCardSkeleton />
      <ListCardSkeleton />
    </div>
  );
}

export default function DiscoverPage() {
  const mounted = useMounted();
  const { dbUser, isReady } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<DropCategory | 'all'>('all');
  const { data, isPending, isPlaceholderData, isError } = useDiscoverData(page, selectedCategory);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const showFullPageSkeleton = !mounted || !isReady || (isPending && data === undefined);

  if (showFullPageSkeleton) return <DiscoverSkeleton />;

  if (isError) {
    return (
      <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
        <DiscoverDotGrid />
        <TapokNavbar />
        <PageBackdropWatermark label="DISCOVER" />
        <main className="relative z-1 mx-auto max-w-4xl px-4 py-20 text-center">
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
    <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <DiscoverDotGrid />
      <TapokNavbar />
      <PageBackdropWatermark label="DISCOVER" />

      <main className="relative z-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        {/* Hero — headline + status pill (matches activity / drops hero rhythm) */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
          <div className="min-w-0 flex-1">
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              FIND YOUR DROP
            </p>
            <h1 className="mt-3 font-passion text-[clamp(52px,11vw,84px)] font-black uppercase leading-[0.85] tracking-tight text-tok-black">
              WHAT&apos;S{' '}
              <span className="text-tok-teal">LIVE.</span>
            </h1>
          </div>
          <DiscoverHeroStatus isPlaceholderData={isPlaceholderData} publicTotal={allPublic.total} />
        </div>

        {/* Featured Drop */}
        {featured && (
          <div className="mb-16">
            <div className="my-4 flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
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
          {isPlaceholderData ? (
            <PublicDropsListSkeleton />
          ) : allPublic.data.length === 0 && recentChiefsDrops.length === 0 ? (
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
        {allPublic.totalPages > 1 && !isPlaceholderData && (
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
