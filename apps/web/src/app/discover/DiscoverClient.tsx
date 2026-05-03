'use client';

import React, { useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import { TapokNavbar } from '@/components/tapok-navbar';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import {
  useInfiniteDiscoverDrops,
  useDiscoverLayout,
} from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  ArrowRight,
  Filter,
  Users,
  Loader2,
  Globe,
} from 'lucide-react';
import {
  HeroDropCard,
  ListDropCard,
  HeroCardSkeleton,
  ListCardSkeleton,
} from '@/components/drops/drop-cards';
import type { Drop, DropCategory } from '@/types/drop';
import { cn } from '@/lib/utils';

// ── components ────────────────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: DropCategory | undefined }[] = [
  { label: 'ALL', value: undefined },
  { label: 'HANGOUTS', value: 'hangout' },
  { label: 'PARTIES', value: 'party' },
];

function CategoryFilter({
  active,
  onSelect,
}: {
  active: DropCategory | undefined;
  onSelect: (val: DropCategory | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onSelect(cat.value)}
          className={cn(
            'flex h-10 items-center px-5 font-passion text-[11px] font-black uppercase tracking-[2px] border-[3px] border-tok-black rounded-sm transition-all',
            active === cat.value
              ? 'bg-tok-black text-tok-cream shadow-[4px_4px_0px_#1C1C1A]'
              : 'bg-white text-tok-black hover:bg-tok-black/5',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  sub,
  className,
}: {
  icon: any;
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-2', className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
          <Icon size={20} className="text-tok-black" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-teal">
            {sub || 'System Signal'}
          </p>
          <h2 className="font-passion text-3xl font-black uppercase tracking-tight text-tok-black leading-none mt-1">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="relative min-h-screen bg-tok-cream text-tok-black">
      <TapokNavbar />
      <PageBackdropWatermark label="DISCOVER" />
      <main className="relative z-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16 lg:px-10 pb-24">
        {/* Header Skeleton */}
        <div className="mb-16">
          <Skeleton className="h-3 w-40 rounded-sm bg-tok-teal/30 mb-4" />
          <Skeleton className="h-[clamp(52px,11vw,84px)] w-[min(100%,480px)] rounded-sm bg-tok-black/10" />
        </div>

        <div className="space-y-16">
          {/* Featured */}
          <section>
            <div className="mb-8 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-sm bg-tok-teal/20" />
                <Skeleton className="h-6 w-48 rounded-sm bg-tok-black/10" />
              </div>
            </div>
            <HeroCardSkeleton />
          </section>

          {/* Separator */}
          <div className="my-12 border-b-2 border-dashed border-tok-black/10" />

          {/* Squad Recon */}
          <section>
            <div className="mb-8 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-28 rounded-sm bg-tok-teal/20" />
                <Skeleton className="h-6 w-40 rounded-sm bg-tok-black/10" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ListCardSkeleton />
              <ListCardSkeleton />
              <ListCardSkeleton />
            </div>
          </section>

          {/* Separator */}
          <div className="my-12 border-b-2 border-dashed border-tok-black/10" />

          {/* Public Stream */}
          <section>
            <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 rounded-sm bg-tok-teal/20" />
                  <Skeleton className="h-6 w-44 rounded-sm bg-tok-black/10" />
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-28 rounded-sm border-[3px] border-tok-black bg-white" />
                ))}
              </div>
            </div>
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="mb-6 break-inside-avoid">
                  <ListCardSkeleton />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function DiscoverClient() {
  const router = useRouter();
  const mounted = useMounted();
  const { dbUser, isReady } = useAuth();
  const [category, setCategory] = useState<DropCategory | undefined>(undefined);
  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);

  // 1. Static Layout (Featured + Squad Recon)
  const {
    data: layoutData,
    isLoading: isLoadingLayout,
    isError: isErrorLayout,
  } = useDiscoverLayout();

  // 2. Paginated Stream
  const {
    data: streamData,
    isLoading: isLoadingStream,
    isError: isErrorStream,
    isFetching: isFetchingStream,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteDiscoverDrops({ category, limit: 15, uid: dbUser?.id });

  const isError = isErrorLayout || isErrorStream;

  const allPublicDrops = streamData?.pages.flatMap(page => page.allPublic.data) ?? [];
  const featuredDrop = layoutData?.featured;
  const squadReconDrops = layoutData?.recentChiefsDrops;
  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!mounted || !isReady) return <PageSkeleton />;

  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  return (
    <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      {/* Visual background flourishes */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <TapokNavbar />
      <PageBackdropWatermark label="DISCOVER" />

      <main className="relative z-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16 lg:px-10 pb-24">
        {/* Header Row */}
        <div className="mb-16 animate-fade-up">
          <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
            EXPLORE THE SCENE
          </p>
          <h1 className="font-passion text-[clamp(52px,11vw,84px)] font-black uppercase leading-[0.8] tracking-tight text-tok-black">
            DISCOVER <span className="text-tok-teal">MISSIONS.</span>
          </h1>
        </div>

        {isError ? (
          <div className="rounded-2xl border-[3px] border-tok-black bg-white p-12 text-center shadow-[12px_12px_0px_#1C1C1A]">
            <h2 className="font-passion text-3xl font-black uppercase text-tok-black">
              System Scan Failed
            </h2>
            <p className="mt-4 text-tok-black/60">
              We couldn&apos;t load the discovery feed. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 inline-flex h-12 items-center px-8 font-passion text-xs font-bold uppercase tracking-[2px] border-[3px] border-tok-black bg-tok-teal text-white shadow-[4px_4px_0px_#1C1C1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1C1C1A] transition-all"
            >
              Retry Sync
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Section */}
            {(isLoadingLayout || featuredDrop) && (
              <section className="animate-fade-up [animation-delay:200ms]">
                <SectionHeading
                  icon={Sparkles}
                  title="Featured Mission"
                  sub="Current Highlight"
                />
                {isLoadingLayout ? (
                  <HeroCardSkeleton />
                ) : featuredDrop ? (
                  <HeroDropCard
                    drop={featuredDrop as unknown as Drop}
                    viewerId={dbUser?.id}
                    onShare={handleShare}
                  />
                ) : null}
              </section>
            )}

            {/* SQUAD RECON */}
            {(!!dbUser && (isLoadingLayout || (squadReconDrops?.length ?? 0) > 0)) && (
              <>
                <div className="my-12 border-b-2 border-dashed border-tok-black/10" />
                <section className="animate-fade-up [animation-delay:300ms]">
                  <SectionHeading
                    icon={Users}
                    title="Squad Recon"
                    sub="Active in your network"
                  />
                  {isLoadingLayout ? (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                      <ListCardSkeleton layout="grid" />
                      <ListCardSkeleton layout="grid" />
                      <ListCardSkeleton layout="grid" />
                      <ListCardSkeleton layout="grid" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                      {squadReconDrops?.slice(0, 4).map((drop) => (
                        <ListDropCard
                          key={drop.id}
                          drop={drop as unknown as Drop}
                          viewerId={dbUser?.id}
                          onShare={handleShare}
                          layout="grid"
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Separator before Stream */}
            <div className="my-12 border-b-2 border-dashed border-tok-black/10" />

            {/* Public Stream */}
            <section className="animate-fade-up [animation-delay:400ms]">
              <div className="my-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                  <SectionHeading
                    icon={Filter}
                    title="Public Stream"
                    sub="Open grid missions"
                    className="mb-0"
                  />
                </div>
                <CategoryFilter active={category} onSelect={setCategory} />
              </div>

              <div className="relative min-h-[400px]">
                {/* Center Loader Overlay */}
                {(isFetchingStream && !isFetchingNextPage) && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-tok-cream/10 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-tok-black bg-white p-8 shadow-[8px_8px_0px_#1C1C1A] animate-in fade-in zoom-in duration-300">
                      <Loader2 size={32} className="animate-spin text-tok-teal" />
                      <p className="font-passion text-sm font-bold uppercase tracking-[2px] text-tok-black">
                        Syncing Board...
                      </p>
                    </div>
                  </div>
                )}

                {isLoadingStream ? (
                  <div className="columns-2 gap-4 sm:columns-2 sm:gap-6 lg:columns-3">
                    {/* Row 1 */}
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="grid" /> {/* Standard vertical */}
                    </div>
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="masonry" /> {/* Default portraitish */}
                    </div>
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="grid" />
                    </div>
                    {/* Row 2 */}
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="masonry" />
                    </div>
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="grid" />
                    </div>
                    <div className="mb-4 break-inside-avoid sm:mb-6">
                      <ListCardSkeleton layout="masonry" />
                    </div>
                  </div>
                ) : allPublicDrops.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-center rounded-2xl border-4 border-dashed border-tok-black/10">
                    <p className="font-passion text-lg font-bold uppercase tracking-widest text-tok-black/20">
                      No missions found
                    </p>
                  </div>
                ) : (
                  <div className="columns-2 gap-4 sm:columns-2 sm:gap-6 lg:columns-3">
                    {allPublicDrops.map((drop) => (
                      <div key={drop.id} className="break-inside-avoid mb-4 sm:mb-6">
                        <ListDropCard
                          drop={drop as unknown as Drop}
                          viewerId={dbUser?.id}
                          onShare={handleShare}
                          layout="masonry"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Load More Trigger */}
                <div ref={observerTarget} className="mt-12 flex justify-center py-8">
                  {isFetchingNextPage ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-tok-teal" />
                      <p className="font-passion text-xs font-bold uppercase tracking-[2px] text-tok-teal">
                        Syncing grid...
                      </p>
                    </div>
                  ) : hasNextPage ? (
                    <div className="h-8 w-full" />
                  ) : allPublicDrops.length > 0 ? (
                    <p className="font-passion text-[10px] font-bold uppercase tracking-[3px] text-tok-black/20">
                      — End of Signal —
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {shareModalDrop && (
        <DropShareModal
          drop={shareModalDrop}
          onClose={() => setShareModalDrop(null)}
        />
      )}
    </div>
  );
}
