'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  ClipboardCopy,
  Edit3,
  LogIn,
  MapPin,
  Plus,
  Lock,
  Ticket,
  Users,
} from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { DropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { DeleteDropModal } from '@/components/drops/DeleteDropModal';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyDrops } from '@/hooks/queries/use-drops';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Drop, DropStatus } from '@/types/drop';

import {
  HeroDropCard,
  ListDropCard,
  HeroCardSkeleton,
  ListCardSkeleton,
} from '@/components/drops/drop-cards';

function sortRecent(a: Drop, b: Drop) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function GateCard() {
  const router = useRouter();
  const [gateCode, setGateCode] = useState('');

  const handleGateJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = gateCode.trim().toUpperCase();
    if (code.length < 4) return;
    router.push(`/drops/join/${code}`);
  };

  return (
    <div className="rounded-2xl border-[3px] border-tok-black bg-white p-7 shadow-[12px_12px_0px_#1C1C1A] sm:p-10">
      <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
        SECURITY PROTOCOL
      </p>
      <h2 className="mt-4 font-passion text-4xl font-bold uppercase leading-none tracking-tight text-tok-black">
        Sign in to manage <br className="hidden sm:block" /> or join a Drop.
      </h2>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/login"
          className="flex h-12 items-center justify-center gap-3 rounded-sm border-[3px] border-tok-black bg-tok-teal px-8 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-cream transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          <LogIn size={16} strokeWidth={2.5} />
          Log in
        </Link>
        <Link
          href="/register"
          className="flex h-12 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white px-8 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          Sign up
        </Link>
      </div>
      <div className="mt-10 border-t-2 border-dashed border-tok-black/10 pt-10">
        <p className="font-passion text-[10px] font-bold uppercase tracking-[3px] text-tok-black/40">
          Got a join code?
        </p>
        <form onSubmit={handleGateJoin} className="mt-4 flex gap-3">
          <Input
            value={gateCode}
            onChange={(e) => setGateCode(e.target.value.toUpperCase())}
            placeholder="ENTER TOKEN"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="h-12 flex-1 rounded-sm border-[3px] border-tok-black bg-white px-5 font-passion text-base font-bold tracking-[2px] text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            type="submit"
            disabled={gateCode.trim().length < 4}
            className="flex h-12 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-black px-6 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-cream transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            GO
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyTabState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-tok-black/16 bg-white/50">
        <CalendarDays size={22} className="text-tok-black/28" />
      </div>
      <p className="mt-4 font-passion text-[11px] font-bold uppercase tracking-[2.2px] text-tok-black/32">
        {message}
      </p>
      <p className="mt-2 max-w-xs text-[12px] leading-6 text-tok-black/46">{sub}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-tok-cream text-tok-black">
      <TapokNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/10" />
            <Skeleton className="h-12 w-48 rounded-sm bg-tok-black/5" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40 rounded-sm bg-tok-black/5 border-[3px] border-tok-black/5" />
            <Skeleton className="h-12 w-32 rounded-sm bg-tok-black/5 border-[3px] border-tok-black/5" />
          </div>
        </div>
        <HeroCardSkeleton />
        <div className="mt-8 space-y-2">
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      </main>
    </div>
  );
}

export default function DropsPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { user, dbUser, loading, isReady } = useAuth();
  const {
    data: drops = [],
    isLoading,
    isFetched,
    isError,
  } = useMyDrops({
    enabled: isReady && Boolean(user),
  });

  // Use isFetched to prevent premature "empty" states during initial load
  const isHardLoading = !isFetched || (isLoading && drops.length === 0);

  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDrop, setEditDrop] = useState<Drop | null>(null);
  const [deleteDrop, setDeleteDrop] = useState<Drop | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isJoiningNavigation, setIsJoiningNavigation] = useState(false);

  const { activeDrops, completedDrops, focusDrop, upcomingCount, pastCount } = useMemo(() => {
    const current = drops.filter(
      (d) => d.status === 'active' || d.status === 'ongoing'
    );
    const focus = current[0] ?? null;
    const upcoming = current.filter(
      (d) => d.status === 'active' && d.id !== focus?.id
    );
    const past = [
      ...drops.filter((d) => d.status === 'completed'),
      ...current.filter((d) => d.status === 'ongoing' && d.id !== focus?.id),
    ].sort(sortRecent);

    return {
      activeDrops: upcoming,
      completedDrops: past,
      focusDrop: focus,
      upcomingCount: current.filter((d) => d.status === 'active').length,
      pastCount: past.length,
    };
  }, [drops]);

  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  const handleJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4 || isJoiningNavigation) return;
    setIsJoiningNavigation(true);
    router.push(`/drops/join/${code}`);
  };

  if (!mounted || !isReady || (loading && !dbUser)) return <PageSkeleton />;

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                Drops
              </p>
              <h1 className="mt-3 font-passion text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-tok-black">
                One Drop. One Crew.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-tok-black/64">
                TapOk is where a plan becomes real. Sign in to create a Drop,
                join a Crew, and keep the log in one place.
              </p>
            </div>
            <GateCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <TapokNavbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        {/* Page header row */}
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              COMMAND CENTER
            </p>
            <h1 className="font-passion text-[clamp(56px,12vw,84px)] font-black uppercase leading-[0.8] tracking-tighter text-tok-black">
              YOUR <span className="text-tok-teal">BOARD.</span>
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Join code form */}
            <form
              onSubmit={handleJoin}
              className="flex h-12 w-full items-center rounded-sm border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto"
            >
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ACCESS CODE"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="h-full flex-1 border-0 bg-transparent px-4 font-passion text-xs font-bold tracking-[2px] text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-32 sm:flex-none"
              />
              <button
                type="submit"
                disabled={joinCode.trim().length < 4 || isJoiningNavigation}
                className="flex h-full w-24 items-center justify-center border-l-[3px] border-tok-black bg-tok-teal font-passion text-xs font-bold uppercase tracking-[2px] text-tok-cream transition-all hover:bg-tok-teal/90 disabled:bg-tok-black/20 disabled:text-tok-black/40"
              >
                {isJoiningNavigation ? '...' : 'JOIN'}
              </button>
            </form>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-sm border-[3px] border-tok-black bg-tok-teal px-6 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-cream shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Drop
            </button>
          </div>
        </div>

        {/* Board */}
        {isHardLoading ? (
          <>
            <HeroCardSkeleton />
            <div className="mt-4 space-y-2">
              <ListCardSkeleton />
              <ListCardSkeleton />
            </div>
          </>
        ) : isError ? (
          <Alert className="rounded-[20px] border-tok-black/10 bg-white/72 p-6 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/34">
              Something slipped
            </p>
            <AlertTitle className="mt-3 font-passion text-[24px] font-bold uppercase tracking-[-0.03em] text-tok-black">
              We could not load your Drops.
            </AlertTitle>
            <AlertDescription className="mt-3 max-w-xl text-[14px] leading-7 text-tok-black/64">
              Try again in a moment. Your session may need a refresh if this
              keeps happening.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Hero / Focus card — always shown when there's an active drop */}
            {focusDrop && (
              <HeroDropCard
                drop={focusDrop}
                viewerId={dbUser?.id}
                onShare={handleShare}
                onEdit={setEditDrop}
                onDelete={setDeleteDrop}
              />
            )}

            {/* Tab bar */}
            <div className="mt-8 flex items-center justify-between">
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-sm border-[3px] border-tok-black px-6 font-passion text-xs font-bold uppercase tracking-[2px] transition-all',
                    activeTab === 'upcoming'
                      ? 'bg-tok-black text-tok-cream'
                      : 'bg-white text-tok-black hover:bg-tok-black/5',
                  )}
                >
                  Upcoming
                  <span
                    className={cn(
                      'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      activeTab === 'upcoming'
                        ? 'bg-white/20 text-tok-cream'
                        : 'bg-tok-black/10 text-tok-black/40',
                    )}
                  >
                    {upcomingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('past')}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-sm border-[3px] border-tok-black px-6 font-passion text-xs font-bold uppercase tracking-[2px] transition-all',
                    activeTab === 'past'
                      ? 'bg-tok-black text-[#F7E9B2]'
                      : 'bg-white text-tok-black hover:bg-tok-black/5',
                  )}
                >
                  Past
                  <span
                    className={cn(
                      'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      activeTab === 'past'
                        ? 'bg-white/20 text-[#F7E9B2]'
                        : 'bg-tok-black/10 text-tok-black/40',
                    )}
                  >
                    {pastCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-3 space-y-2">
              {activeTab === 'upcoming' ? (
                upcomingCount === 0 ? (
                  <EmptyTabState
                    message="Nothing upcoming"
                    sub="Create a new Drop or join one with a code and it will appear here."
                  />
                ) : activeDrops.length === 0 ? (
                  <p className="py-6 text-center font-passion text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                    That's your only upcoming drop — shown above
                  </p>
                ) : (
                  activeDrops.map((drop) => (
                    <ListDropCard
                      key={drop.id}
                      drop={drop}
                      viewerId={dbUser?.id}
                      onShare={handleShare}
                      onEdit={setEditDrop}
                      onDelete={setDeleteDrop}
                    />
                  ))
                )
              ) : pastCount === 0 ? (
                <EmptyTabState
                  message="No past drops"
                  sub="Finished plans will collect here with their logs and share links."
                />
              ) : completedDrops.length === 0 ? (
                <p className="py-6 text-center font-passion text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                  That's your focus drop — shown above
                </p>
              ) : (
                completedDrops.map((drop) => (
                  <ListDropCard
                    key={drop.id}
                    drop={drop}
                    viewerId={dbUser?.id}
                    onShare={handleShare}
                    onEdit={setEditDrop}
                    onDelete={setDeleteDrop}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {shareModalDrop && (
        <DropShareModal
          drop={shareModalDrop}
          onClose={() => setShareModalDrop(null)}
        />
      )}
      {createModalOpen && (
        <DropModal onClose={() => setCreateModalOpen(false)} />
      )}
      {editDrop && editDrop.organiserId === dbUser?.id && (
        <DropModal drop={editDrop} onClose={() => setEditDrop(null)} />
      )}
      {deleteDrop && deleteDrop.organiserId === dbUser?.id && (
        <DeleteDropModal 
          drop={deleteDrop} 
          onClose={() => setDeleteDrop(null)} 
        />
      )}
    </div>
  );
}
