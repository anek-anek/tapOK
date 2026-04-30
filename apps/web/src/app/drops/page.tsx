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
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed';

  return (
    <div className="relative overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal px-6 py-6 shadow-[8px_8px_0px_#1C1C1A]">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-[#F7E9B2]/20 bg-[#F7E9B2]/10 font-passion text-xl font-bold tracking-widest text-[#F7E9B2]">
            {getInitials(drop.name)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-passion text-[10px] font-bold uppercase tracking-[3px] text-amber-400">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                Next Drop
              </span>
              {!drop.isPublic && (
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-tok-black/20 px-2 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-[#F7E9B2]">
                  <Lock size={10} strokeWidth={3} />
                  Private
                </span>
              )}
            </div>
            <h2 className="mt-1 font-passion text-3xl font-bold leading-none tracking-tight text-[#F7E9B2]">
              {drop.name}
            </h2>
            <p className="mt-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[3px] text-[#F7E9B2]/40">
              {role} • <span className="text-[#F7E9B2]/60">{drop.joinCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onShare(drop)}
            className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-[#F7E9B2]/20 bg-[#F7E9B2]/10 text-[#F7E9B2] transition-all hover:-translate-y-0.5 hover:bg-[#F7E9B2]/20 active:translate-y-0"
          >
            <ClipboardCopy size={16} strokeWidth={2.5} />
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(drop)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-[#F7E9B2]/20 bg-[#F7E9B2]/10 text-[#F7E9B2] transition-all hover:-translate-y-0.5 hover:bg-[#F7E9B2]/20 active:translate-y-0"
            >
              <Edit3 size={16} strokeWidth={2.5} />
            </button>
          )}
          <Link
            href={`/drops/${drop.id}`}
            className="flex h-10 items-center justify-center gap-2.5 rounded-sm border-2 border-tok-black bg-[#F7E9B2] px-5 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-teal transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
          >
            <span className="pt-0.5">Open Drop</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 border-t-2 border-dashed border-[#F7E9B2]/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={14} className="text-[#F7E9B2]/60" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-[#F7E9B2]/60">{formatDateTime(drop.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-[#F7E9B2]/60" strokeWidth={2.5} />
          <span className="font-passion truncate text-[11px] font-bold uppercase tracking-wider text-[#F7E9B2]/60">{drop.location}</span>
        </div>
        <div className="flex items-center gap-3">
          <Users size={14} className="text-[#F7E9B2]/60" strokeWidth={2.5} />
          <span className="font-passion truncate text-[11px] font-bold uppercase tracking-wider text-[#F7E9B2]/60">{drop.organiser.firstName} {drop.organiser.lastName}</span>
        </div>
        {drop.expectedHeadcount ? (
          <div className="flex items-center gap-3">
            <Ticket size={14} className="text-[#F7E9B2]/60" strokeWidth={2.5} />
            <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-[#F7E9B2]/60">{drop.expectedHeadcount} CREW EXPECTED</span>
          </div>
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
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed';
  const isCompleted = drop.status === 'completed';

  return (
    <div
      className={cn(
        'group flex flex-col gap-4 rounded-xl border-[3px] border-tok-black p-5 transition-all sm:flex-row sm:items-center mt-4',
        isCompleted
          ? 'bg-tok-black/5 opacity-70 grayscale'
          : 'bg-white shadow-[4px_4px_0px_#1C1C1A] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]',
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black font-passion text-sm font-bold tracking-widest',
            isCompleted
              ? 'bg-tok-black/10 text-tok-black/40'
              : 'bg-tok-teal text-[#F7E9B2]',
          )}
        >
          {getInitials(drop.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-tok-black/30">
              {role}
            </span>
            {isCompleted && (
              <span className="font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-tok-black/40">
                • COMPLETED
              </span>
            )}
            {!drop.isPublic && (
              <span className="font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-tok-teal/40">
                • PRIVATE
              </span>
            )}
          </div>
          <p
            className={cn(
              'truncate font-passion text-xl font-bold uppercase tracking-tight',
              isCompleted ? 'text-tok-black/50' : 'text-tok-black',
            )}
          >
            {drop.name}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-tok-black/40">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={12} strokeWidth={2.5} />
              <span className="font-passion uppercase tracking-wider">{formatDateTime(drop.scheduledAt)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} strokeWidth={2.5} />
              <span className="font-passion truncate uppercase tracking-wider">{drop.location}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onEdit(drop)}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0"
            >
              <Edit3 size={14} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => onShare(drop)}
            className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0"
          >
            <ClipboardCopy size={14} strokeWidth={2.5} />
          </button>
        </div>
        <Link
          href={`/drops/${drop.id}`}
          className="flex h-9 items-center gap-2 rounded-sm border-2 border-tok-black bg-tok-teal px-4 font-passion text-[10px] font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          View
          <ArrowRight size={12} strokeWidth={2.5} />
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
          className="flex h-12 items-center justify-center gap-3 rounded-sm border-[3px] border-tok-black bg-tok-teal px-8 font-passion text-xs font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
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
            className="flex h-12 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-black px-6 font-passion text-xs font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
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
  const mounted = useMounted();
  const { user, dbUser, loading, isReady } = useAuth();
  const {
    data: drops = [],
    isLoading,
    isError,
  } = useMyDrops({
    enabled: isReady && Boolean(user),
  });
  const isHardLoading = isLoading && drops.length === 0;
  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDrop, setEditDrop] = useState<Drop | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isJoiningNavigation, setIsJoiningNavigation] = useState(false);

  const { activeDrops, completedDrops, focusDrop, remainingActive } = useMemo(() => {
    // The backend already returns drops sorted by scheduledAt ASC
    const active = drops.filter(
      (d) => d.status === 'active' || d.status === 'ongoing'
    );
    const completed = drops
      .filter((d) => d.status === 'completed')
      .sort(sortRecent);
    
    const focus = active[0] ?? null;
    const remaining = focus ? active.filter((d) => d.id !== focus.id) : active;

    return {
      activeDrops: active,
      completedDrops: completed,
      focusDrop: focus,
      remainingActive: remaining,
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

  if (!mounted || !isReady) return <PageSkeleton />;

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

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Page header row */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-passion text-[11px] font-bold uppercase tracking-[2px] sm:tracking-[4px] text-tok-teal">
              COMMAND CENTER
            </p>
            <h1 className="mt-1 font-passion text-4xl font-bold uppercase tracking-tight text-tok-black sm:text-5xl">
              Drops.
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
                className="h-full border-l-[3px] border-tok-black bg-tok-teal px-5 font-passion text-xs font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-all hover:bg-tok-teal/90 disabled:bg-tok-black/20 disabled:text-tok-black/40"
              >
                {isJoiningNavigation ? '...' : 'JOIN'}
              </button>
            </form>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-teal px-6 font-passion text-xs font-bold uppercase tracking-[2px] text-[#F7E9B2] shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Drop
            </button>
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
            <div className="mt-8 flex items-center justify-between">
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-sm border-[3px] border-tok-black px-6 font-passion text-xs font-bold uppercase tracking-[2px] transition-all',
                    activeTab === 'upcoming'
                      ? 'bg-tok-black text-[#F7E9B2]'
                      : 'bg-white text-tok-black hover:bg-tok-black/5',
                  )}
                >
                  Upcoming
                  <span
                    className={cn(
                      'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      activeTab === 'upcoming'
                        ? 'bg-white/20 text-[#F7E9B2]'
                        : 'bg-tok-black/10 text-tok-black/40',
                    )}
                  >
                    {activeDrops.length}
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
                    {completedDrops.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-3 space-y-2">
              {activeTab === 'upcoming' ? (
                activeDrops.length === 0 ? (
                  <EmptyTabState
                    message="Nothing upcoming"
                    sub="Create a new Drop or join one with a code and it will appear here."
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
      {editDrop && editDrop.organiserId === dbUser?.id && (
        <DropModal drop={editDrop} onClose={() => setEditDrop(null)} />
      )}
    </div>
  );
}
