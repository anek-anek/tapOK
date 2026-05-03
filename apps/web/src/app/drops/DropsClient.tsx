'use client';

import { useEffect, useMemo, useState, type ClipboardEvent, type FormEvent } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays,
  LogIn,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import { DropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
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
import type { Drop } from '@/types/drop';

import {
  HeroDropCard,
  ListDropCard,
  HeroCardSkeleton,
  ListCardSkeleton,
} from '@/components/drops/drop-cards';

function sortRecent(a: Drop, b: Drop) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function sortByScheduledAtAsc(a: Drop, b: Drop) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

/** Join codes are uppercase hex; strip whitespace and non-hex so paste/mobile keyboards behave reliably. */
function sanitizeJoinCode(raw: string): string {
  return raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-F0-9]/g, '')
    .slice(0, 16);
}

function handleJoinCodePaste(
  e: ClipboardEvent<HTMLInputElement>,
  currentValue: string,
  setValue: (next: string) => void,
) {
  const pasted = e.clipboardData?.getData('text/plain');
  if (pasted == null || pasted === '') return;
  e.preventDefault();
  const el = e.currentTarget;
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : currentValue.length;
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : currentValue.length;
  const merged = sanitizeJoinCode(currentValue.slice(0, start) + pasted + currentValue.slice(end));
  setValue(merged);
  queueMicrotask(() => {
    try {
      const caret = merged.length;
      el.setSelectionRange(caret, caret);
    } catch {
      /* Safari / some webviews may throw if input lost focus */
    }
  });
}

function DropsDotGrid() {
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

function GateCard() {
  const router = useRouter();
  const pathname = usePathname();
  const [gateCode, setGateCode] = useState('');

  useEffect(() => {
    if (pathname === '/drops') {
      setGateCode('');
    }
  }, [pathname]);

  const handleGateJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = sanitizeJoinCode(gateCode);
    if (code.length < 4) return;
    setGateCode('');
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
            type="text"
            name="join-code"
            value={gateCode}
            onChange={(e) => setGateCode(sanitizeJoinCode(e.target.value))}
            placeholder="ENTER TOKEN"
            inputMode="text"
            enterKeyHint="go"
            autoCapitalize="none"
            autoCorrect="off"
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

/** Hero + tab strip + list rows — matches the board below the static page header. */
function DropsBoardBodySkeleton() {
  return (
    <>
      <HeroCardSkeleton />

      <div className="mt-8 flex items-center justify-end">
        <div className="flex gap-2">
          <Skeleton className="flex h-10 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-black px-5">
            <Skeleton className="h-3 w-16 rounded-sm bg-white/25" />
            <Skeleton className="h-5 w-7 rounded-full bg-white/20" />
          </Skeleton>
          <Skeleton className="flex h-10 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-white px-5">
            <Skeleton className="h-3 w-10 rounded-sm bg-tok-black/15" />
            <Skeleton className="h-5 w-7 rounded-full bg-tok-black/10" />
          </Skeleton>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <ListCardSkeleton />
        <ListCardSkeleton />
      </div>
    </>
  );
}

function DropsBoardSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-4">
          <Skeleton className="h-3 w-44 rounded-sm bg-tok-teal/30" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[clamp(44px,10vw,72px)] max-w-[min(100%,320px)] rounded-sm bg-tok-black/10" />
            <Skeleton className="h-[clamp(44px,10vw,72px)] max-w-[min(100%,220px)] rounded-sm bg-tok-teal/35" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex h-12 w-full overflow-hidden rounded-sm border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:w-auto">
            <Skeleton className="h-full min-w-[140px] flex-1 rounded-none bg-tok-black/6" />
            <Skeleton className="h-full w-24 shrink-0 rounded-none border-l-[3px] border-tok-black bg-tok-teal/40" />
          </div>
          <Skeleton className="flex h-12 w-full items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-teal/35 px-6 shadow-[4px_4px_0px_#1C1C1A] sm:w-auto sm:min-w-[148px]" />
        </div>
      </div>

      <DropsBoardBodySkeleton />
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="relative min-h-screen bg-tok-cream text-tok-black">
      <DropsDotGrid />
      <TapokNavbar />
      <PageBackdropWatermark label="DROPS" />
      <main className="relative z-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        <DropsBoardSkeleton />
      </main>
    </div>
  );
}

export default function DropsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const { user, dbUser, loading, isReady } = useAuth();
  const {
    data,
    isPending,
    isError,
  } = useMyDrops({
    enabled: isReady && Boolean(user),
  });

  const drops = data ?? [];
  const showBoardBodySkeleton = isPending;

  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isJoiningNavigation, setIsJoiningNavigation] = useState(false);

  useEffect(() => {
    if (pathname === '/drops') {
      setJoinCode('');
      setIsJoiningNavigation(false);
    }
  }, [pathname]);

  const { activeDrops, completedDrops, focusDrop, upcomingCount, pastCount } = useMemo(() => {
    const current = drops
      .filter((d) => d.status === 'active' || d.status === 'ongoing')
      .sort(sortByScheduledAtAsc);
    const focus = current[0] ?? null;
    const upcoming = current.filter((d) => d.id !== focus?.id);
    const past = drops.filter((d) => d.status === 'completed').sort(sortRecent);

    return {
      activeDrops: upcoming,
      completedDrops: past,
      focusDrop: focus,
      upcomingCount: current.length,
      pastCount: past.length,
    };
  }, [drops]);

  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  const handleJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = sanitizeJoinCode(joinCode);
    if (code.length < 4 || isJoiningNavigation) return;
    setJoinCode('');
    setIsJoiningNavigation(true);
    router.push(`/drops/join/${code}`);
  };

  if (!mounted || !isReady || (loading && !dbUser)) return <PageSkeleton />;

  if (!loading && !user) {
    return (
      <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
        <DropsDotGrid />
        <TapokNavbar />
        <PageBackdropWatermark label="DROPS" />
        <main className="relative z-1 mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-10">
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
    <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <DropsDotGrid />
      <TapokNavbar />
      <PageBackdropWatermark label="DROPS" />

      <main className="relative z-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        {dbUser && !dbUser.isEmailVerified && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-sm border-[3px] border-tok-black bg-tok-black p-5 shadow-[6px_6px_0px_#1C1C1A] sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tok-teal">
                <ShieldAlert size={20} className="text-tok-black" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-teal">Account Restricted</p>
                <p className="font-passion text-sm font-bold uppercase tracking-tight text-tok-cream">Your crew status is pending verification.</p>
              </div>
            </div>
            <Link 
              href="/profile"
              className="flex h-10 w-full items-center justify-center rounded-sm border-[3px] border-tok-cream bg-tok-cream px-6 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#14B8A6] sm:w-auto"
            >
              Verify Now
            </Link>
          </div>
        )}

        {/* Page header row */}
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              YOUR DROP BOARD
            </p>
            <h1 className="font-passion whitespace-nowrap text-[clamp(26px,7vw,72px)] font-black uppercase leading-[0.85] tracking-tight text-tok-black">
              THE <span className="text-tok-teal">BOARD.</span>
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Join code form */}
            <form
              onSubmit={handleJoin}
              className="flex h-12 w-full items-center rounded-sm border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto"
            >
              <Input
                type="text"
                name="access-code"
                value={joinCode}
                onChange={(e) => setJoinCode(sanitizeJoinCode(e.target.value))}
                placeholder="ACCESS CODE"
                inputMode="text"
                enterKeyHint="go"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                className="h-full min-h-12 flex-1 border-0 bg-transparent px-4 font-passion text-xs font-bold tracking-[2px] text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-32 sm:flex-none"
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
        {isError ? (
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
        ) : showBoardBodySkeleton ? (
          <DropsBoardBodySkeleton />
        ) : (
          <>
            {/* Hero / Focus card — always shown when there's an active drop */}
            {focusDrop && (
              <HeroDropCard
                drop={focusDrop}
                viewerId={dbUser?.id}
                onShare={handleShare}
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
                    That&apos;s your only upcoming drop — shown above
                  </p>
                ) : (
                  activeDrops.map((drop) => (
                    <ListDropCard
                      key={drop.id}
                      drop={drop}
                      viewerId={dbUser?.id}
                      showShareEditDelete={false}
                    />
                  ))
                )
              ) : pastCount === 0 ? (
                <EmptyTabState
                  message="No past drops"
                  sub="Finished plans will collect here with their logs and share links."
                />
              ) : (
                completedDrops.map((drop) => (
                  <ListDropCard
                    key={drop.id}
                    drop={drop}
                    viewerId={dbUser?.id}
                    showShareEditDelete={false}
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
    </div>
  );
}
