'use client';

import React, { useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import { TapokNavbar } from '@/components/tapok-navbar';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import { useDiscoverDrops } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  ArrowRight,
  Filter,
  Users,
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
  { label: 'ALL MISSIONS', value: undefined },
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

function SectionHeading({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A]">
            <Icon size={18} className="text-tok-black" strokeWidth={2.5} />
          </div>
          <h2 className="font-passion text-2xl font-black uppercase tracking-tight text-tok-black">
            {title}
          </h2>
        </div>
        {sub && (
          <p className="font-inter text-xs font-medium uppercase tracking-[2px] text-tok-black/40">
            {sub}
          </p>
        )}
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
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40 rounded-sm bg-tok-teal/30" />
            <Skeleton className="h-[clamp(52px,11vw,84px)] w-[min(100%,320px)] sm:w-[min(100%,480px)] rounded-sm bg-tok-black/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-32 rounded-sm border-[3px] border-tok-black bg-white" />
            ))}
          </div>
        </div>

        <div className="grid gap-12">
          {/* Featured */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg border-2 border-tok-black bg-tok-cream" />
              <Skeleton className="h-7 w-48 rounded-sm bg-tok-black/10" />
            </div>
            <HeroCardSkeleton />
          </section>

          {/* List Skeleton */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg border-2 border-tok-black bg-tok-cream" />
              <Skeleton className="h-7 w-40 rounded-sm bg-tok-black/10" />
            </div>
            <div className="grid gap-4">
              <ListCardSkeleton />
              <ListCardSkeleton />
              <ListCardSkeleton />
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

  const {
    data,
    isLoading,
    isError,
  } = useDiscoverDrops({ category });

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
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-fade-up">
          <div>
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              EXPLORE THE SCENE
            </p>
            <h1 className="font-passion text-[clamp(52px,11vw,84px)] font-black uppercase leading-[0.8] tracking-tight text-tok-black">
              DISCOVER{' '}
              <span className="text-tok-teal">MISSIONS.</span>
            </h1>
          </div>

          <CategoryFilter active={category} onSelect={setCategory} />
        </div>

        {isLoading ? (
          <div className="grid gap-12">
            <section>
              <SectionHeading icon={Sparkles} title="Featured Drop" sub="Recommended for you" />
              <HeroCardSkeleton />
            </section>
            <section>
              <SectionHeading icon={Filter} title="All Public Drops" sub="Browse the latest" />
              <div className="grid gap-4">
                <ListCardSkeleton />
                <ListCardSkeleton />
                <ListCardSkeleton />
              </div>
            </section>
          </div>
        ) : isError ? (
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
          <div className="grid gap-16">
            {/* Featured Section */}
            {data?.featured && (
              <section className="animate-fade-up [animation-delay:200ms]">
                <SectionHeading icon={Sparkles} title="Featured Mission" sub="System Highlight" />
                <HeroDropCard
                  drop={data.featured as unknown as Drop}
                  viewerId={dbUser?.id}
                  onShare={handleShare}
                />
              </section>
            )}

            {/* Friends/Chiefs Section */}
            {data?.recentChiefsDrops && data.recentChiefsDrops.length > 0 && (
              <section className="animate-fade-up [animation-delay:300ms]">
                <SectionHeading icon={Users} title="From Your Circle" sub="Missions by people you know" />
                <div className="grid gap-4">
                  {data.recentChiefsDrops.map((drop) => (
                    <ListDropCard
                      key={drop.id}
                      drop={drop as unknown as Drop}
                      viewerId={dbUser?.id}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Public Stream */}
            <section className="animate-fade-up [animation-delay:400ms]">
              <SectionHeading icon={Filter} title="Public Stream" sub="Open missions across the grid" />
              {data?.allPublic.data.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center rounded-2xl border-4 border-dashed border-tok-black/10">
                  <p className="font-passion text-lg font-bold uppercase tracking-widest text-tok-black/20">
                    No missions found
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {data?.allPublic.data.map((drop) => (
                    <ListDropCard
                      key={drop.id}
                      drop={drop as unknown as Drop}
                      viewerId={dbUser?.id}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              )}
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
