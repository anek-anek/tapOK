'use client';

import { useMemo, useState, type FormEvent } from 'react';
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
  Ticket,
  Users,
} from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { DropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyDrops } from '@/hooks/queries/use-drops';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Drop, DropStatus } from '@/types/drop';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function sortUpcoming(a: Drop, b: Drop) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

function sortRecent(a: Drop, b: Drop) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function getRole(drop: Drop, userId?: string | null) {
  return userId && drop.organiserId === userId ? 'Chief' : 'Crew';
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'D'
  );
}

/** The dark teal "Next Up" hero card pinned at the top of the board */
function HeroDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
}: {
  drop: Drop;
  viewerId?: string | null;
  onShare: (drop: Drop) => void;
  onEdit: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const canEdit = drop.status !== 'completed';

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-tok-teal px-5 py-5 shadow-[0_12px_40px_rgba(0,102,102,0.28)] sm:px-6 sm:py-6">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7E9B2]/20 font-passion text-[12px] font-bold tracking-[0.1em] text-[#F7E9B2]">
            {getInitials(drop.name)}
          </div>

          <div>
            {/* Eyebrow row */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-[#F7E9B2]/55">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                Next Up
              </span>
            </div>
            {/* Drop name */}
            <h2 className="mt-1 font-passion text-[clamp(18px,2.2vw,26px)] font-bold uppercase tracking-[-0.03em] text-[#F7E9B2]">
              {drop.name}
            </h2>
            {/* Role tag */}
            <p className="mt-0.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-[#F7E9B2]/40">
              {role}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onShare(drop)}
            aria-label="Share drop"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7E9B2]/10 text-[#F7E9B2]/60 transition-colors hover:bg-[#F7E9B2]/20 hover:text-[#F7E9B2]"
          >
            <ClipboardCopy size={13} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(drop)}
              aria-label="Edit drop"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7E9B2]/10 text-[#F7E9B2]/60 transition-colors hover:bg-[#F7E9B2]/20 hover:text-[#F7E9B2]"
            >
              <Edit3 size={13} />
            </button>
          )}
          <Link
            href={`/drops/${drop.id}`}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#F7E9B2] px-4 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-teal transition-opacity hover:opacity-90"
          >
            Open
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#F7E9B2]/60">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={12} className="text-[#F7E9B2]/40" />
          {formatDateTime(drop.scheduledAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={12} className="text-[#F7E9B2]/40" />
          {drop.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} className="text-[#F7E9B2]/40" />
          {drop.organiser.firstName} {drop.organiser.lastName}
        </span>
        {drop.expectedHeadcount ? (
          <span className="inline-flex items-center gap-1.5">
            <Ticket size={12} className="text-[#F7E9B2]/40" />
            {drop.expectedHeadcount} expected
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Compact list card for the UPCOMING/PAST tabs */
function ListDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
}: {
  drop: Drop;
  viewerId?: string | null;
  onShare: (drop: Drop) => void;
  onEdit: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const canEdit = drop.status !== 'completed';
  const isCompleted = drop.status === 'completed';

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[16px] border px-4 py-3.5 transition-colors hover:bg-white/60',
        isCompleted
          ? 'border-[#2a2118]/8 bg-white/30'
          : 'border-[#2a2118]/10 bg-white/50',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-passion text-[11px] font-bold tracking-[0.1em]',
          isCompleted
            ? 'bg-[#2a2118]/10 text-[#2a2118]/40'
            : 'bg-tok-teal text-[#F7E9B2]',
        )}
      >
        {getInitials(drop.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-passion text-[8.5px] font-bold uppercase tracking-[2px] text-[#2a2118]/25">
            {role}
          </span>
        </div>
        <p
          className={cn(
            'mt-0.5 truncate font-passion text-[15px] font-bold uppercase tracking-[-0.02em]',
            isCompleted ? 'text-[#2a2118]/50' : 'text-[#2a2118]',
          )}
        >
          {drop.name}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#2a2118]/46">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={10} className="text-[#2a2118]/30" />
            {formatDateTime(drop.scheduledAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={10} className="text-[#2a2118]/30" />
            <span className="truncate">{drop.location}</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(drop)}
            aria-label="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#2a2118]/36 transition-colors hover:bg-[#2a2118]/6 hover:text-[#2a2118]"
          >
            <Edit3 size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onShare(drop)}
          aria-label="Share"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#2a2118]/36 transition-colors hover:bg-[#2a2118]/6 hover:text-[#2a2118]"
        >
          <ClipboardCopy size={12} />
        </button>
        <Link
          href={`/drops/${drop.id}`}
          className="flex h-7 items-center gap-1 rounded-full border border-[#2a2118]/12 bg-[#F7E9B2] px-3 font-passion text-[9px] font-bold uppercase tracking-[1.8px] text-[#2a2118] transition-colors hover:bg-[#F7E9B2]/80"
        >
          Open
          <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  );
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
    <div className="rounded-[24px] border border-[#2a2118]/10 bg-white/72 p-5 shadow-[0_14px_40px_rgba(42,33,24,0.06)] sm:rounded-[28px] sm:p-7">
      <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
        Authentication required
      </p>
      <h2 className="mt-3 font-passion text-[clamp(28px,3.8vw,44px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
        Sign in to manage or join a Drop.
      </h2>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/login"
          className={cn(
            buttonVariants(),
            'h-auto rounded-full bg-tok-teal px-5 py-3 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] hover:bg-tok-teal/90 focus-visible:ring-tok-teal/25 focus-visible:ring-offset-white',
          )}
        >
          <LogIn size={14} />
          Log in
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-auto rounded-full border-[#2a2118]/10 bg-white/75 px-5 py-3 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118] hover:border-[#2a2118]/18 hover:bg-white focus-visible:ring-tok-teal/25 focus-visible:ring-offset-white',
          )}
        >
          Sign up
        </Link>
      </div>
      <div className="mt-5 border-t border-[#2a2118]/8 pt-5">
        <p className="font-passion text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
          Got a join code?
        </p>
        <form onSubmit={handleGateJoin} className="mt-3 flex gap-2">
          <Input
            value={gateCode}
            onChange={(e) => setGateCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 rounded-full border-[#2a2118]/10 bg-white/90 px-4 font-passion text-[11px] font-bold tracking-[2.2px] text-[#2a2118] placeholder:text-[#2a2118]/24 focus-visible:border-tok-teal/35 focus-visible:ring-tok-teal/20"
          />
          <Button
            type="submit"
            disabled={gateCode.trim().length < 4}
            className="h-10 rounded-full bg-[#2a2118] px-4 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] hover:bg-[#2a2118]/90 disabled:opacity-50"
          >
            Go
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyTabState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[#2a2118]/16 bg-white/50">
        <CalendarDays size={22} className="text-[#2a2118]/28" />
      </div>
      <p className="mt-4 font-passion text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/32">
        {message}
      </p>
      <p className="mt-2 max-w-xs text-[12px] leading-6 text-[#2a2118]/46">{sub}</p>
    </div>
  );
}

/** Skeleton for the hero card */
function HeroCardSkeleton() {
  return (
    <div className="rounded-[20px] bg-tok-teal/80 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full bg-white/20" />
          <div>
            <Skeleton className="h-2.5 w-24 rounded-full bg-white/20" />
            <Skeleton className="mt-2 h-6 w-44 rounded bg-white/20" />
            <Skeleton className="mt-1.5 h-2 w-12 rounded-full bg-white/15" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
      </div>
      <div className="mt-4 flex gap-5">
        <Skeleton className="h-3 w-32 rounded-full bg-white/15" />
        <Skeleton className="h-3 w-24 rounded-full bg-white/15" />
        <Skeleton className="h-3 w-28 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-[#2a2118]/8 bg-white/40 px-4 py-3.5">
      <Skeleton className="h-10 w-10 rounded-full bg-[#2a2118]/8" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-16 rounded-full bg-[#2a2118]/8" />
        <Skeleton className="h-4 w-40 rounded bg-[#2a2118]/10" />
        <Skeleton className="h-2.5 w-52 rounded-full bg-[#2a2118]/6" />
      </div>
      <Skeleton className="h-7 w-16 rounded-full bg-[#2a2118]/8" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-tok-teal/15">
      <TapokNavbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-28 rounded bg-[#2a2118]/10" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-full bg-[#2a2118]/8" />
            <Skeleton className="h-9 w-16 rounded-full bg-[#2a2118]/10" />
            <Skeleton className="h-9 w-32 rounded-full bg-tok-teal/20" />
          </div>
        </div>
        <HeroCardSkeleton />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full bg-[#2a2118]/10" />
            <Skeleton className="h-9 w-20 rounded-full bg-[#2a2118]/6" />
          </div>
          <Skeleton className="h-3 w-32 rounded-full bg-[#2a2118]/8" />
        </div>
        <div className="mt-4 space-y-2">
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      </main>
    </div>
  );
}

export default function DropsPage() {
  const router = useRouter();
  const { user, dbUser, loading, isReady } = useAuth();
  const {
    data: drops = [],
    isLoading,
    isError,
  } = useMyDrops({
    enabled: Boolean(user) && !loading,
  });
  const isHardLoading = isLoading && !drops.length;
  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDrop, setEditDrop] = useState<Drop | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const sortedUpcoming = useMemo(() => [...drops].sort(sortUpcoming), [drops]);
  const activeDrops = useMemo(
    () =>
      sortedUpcoming.filter(
        (d) => d.status === 'active' || d.status === 'ongoing',
      ),
    [sortedUpcoming],
  );
  const completedDrops = useMemo(
    () => [...drops].filter((d) => d.status === 'completed').sort(sortRecent),
    [drops],
  );
  const focusDrop = activeDrops[0] ?? null;
  const remainingActive = useMemo(
    () => (focusDrop ? activeDrops.filter((d) => d.id !== focusDrop.id) : activeDrops),
    [activeDrops, focusDrop],
  );

  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  const handleJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    router.push(`/drops/join/${code}`);
  };

  if (!isReady) return <PageSkeleton />;

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-tok-teal/15">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                Drops
              </p>
              <h1 className="mt-3 font-passion text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
                One Drop. One Crew.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#2a2118]/64">
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
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-tok-teal/15">
      <TapokNavbar />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Page header row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-passion text-[clamp(28px,4vw,44px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
            Drops
          </h1>

          <div className="flex items-center gap-2">
            {/* Join code form */}
            <form
              onSubmit={handleJoin}
              className="flex items-center overflow-hidden rounded-full border border-[#2a2118]/12 bg-white/70"
            >
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Join code"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="h-9 w-28 border-0 bg-transparent px-3.5 font-passion text-[10px] font-bold tracking-[2px] text-[#2a2118] placeholder:text-[#2a2118]/30 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="h-9 border-l border-[#2a2118]/10 px-3.5 font-passion text-[10px] font-bold uppercase tracking-[2px] text-[#2a2118]/60 transition-colors hover:bg-[#2a2118]/5 hover:text-[#2a2118] disabled:opacity-40"
              >
                Join
              </button>
            </form>

            <Button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="h-9 gap-1.5 rounded-full bg-tok-teal px-4 font-passion text-[10px] font-bold uppercase tracking-[2px] text-[#F7E9B2] hover:bg-tok-teal/90"
            >
              <Plus size={13} />
              New Drop
            </Button>
          </div>
        </div>

        {/* Board */}
        {loading || isHardLoading ? (
          <>
            <HeroCardSkeleton />
            <div className="mt-4 space-y-2">
              <ListCardSkeleton />
              <ListCardSkeleton />
            </div>
          </>
        ) : isError ? (
          <Alert className="rounded-[20px] border-[#2a2118]/10 bg-white/72 p-6 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
              Something slipped
            </p>
            <AlertTitle className="mt-3 font-passion text-[24px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              We could not load your Drops.
            </AlertTitle>
            <AlertDescription className="mt-3 max-w-xl text-[14px] leading-7 text-[#2a2118]/64">
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
              />
            )}

            {/* Tab bar */}
            <div className="mt-4 flex items-center justify-between">
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-full px-4 font-passion text-[11px] font-bold uppercase tracking-[1.8px] transition-colors',
                    activeTab === 'upcoming'
                      ? 'bg-[#2a2118] text-[#F7E9B2]'
                      : 'bg-white/50 text-[#2a2118]/46 hover:bg-white/70 hover:text-[#2a2118]',
                  )}
                >
                  Upcoming
                  <span
                    className={cn(
                      'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                      activeTab === 'upcoming'
                        ? 'bg-white/20 text-[#F7E9B2]'
                        : 'bg-[#2a2118]/8 text-[#2a2118]/50',
                    )}
                  >
                    {activeDrops.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('past')}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-full px-4 font-passion text-[11px] font-bold uppercase tracking-[1.8px] transition-colors',
                    activeTab === 'past'
                      ? 'bg-[#2a2118] text-[#F7E9B2]'
                      : 'bg-white/50 text-[#2a2118]/46 hover:bg-white/70 hover:text-[#2a2118]',
                  )}
                >
                  Past
                  <span
                    className={cn(
                      'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                      activeTab === 'past'
                        ? 'bg-white/20 text-[#F7E9B2]'
                        : 'bg-[#2a2118]/8 text-[#2a2118]/50',
                    )}
                  >
                    {completedDrops.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-3 space-y-2">
              {activeTab === 'upcoming' ? (
                drops.length === 0 ? (
                  <EmptyTabState
                    message="No drops yet"
                    sub="Create the first plan. TapOK generates the link, QR, and join code the moment it goes live."
                  />
                ) : remainingActive.length === 0 && !focusDrop ? (
                  <EmptyTabState
                    message="Nothing upcoming"
                    sub="Create a new Drop and it will appear here as soon as it goes active."
                  />
                ) : remainingActive.length === 0 && focusDrop ? (
                  <p className="py-6 text-center font-passion text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                    That's your only upcoming drop — shown above
                  </p>
                ) : (
                  remainingActive.map((drop) => (
                    <ListDropCard
                      key={drop.id}
                      drop={drop}
                      viewerId={dbUser?.id}
                      onShare={handleShare}
                      onEdit={setEditDrop}
                    />
                  ))
                )
              ) : completedDrops.length === 0 ? (
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
                    onShare={handleShare}
                    onEdit={setEditDrop}
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
      {editDrop && (
        <DropModal drop={editDrop} onClose={() => setEditDrop(null)} />
      )}
    </div>
  );
}
