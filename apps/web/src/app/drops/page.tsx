'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardCopy,
  Clock3,
  Edit3,
  LogIn,
  MapPin,
  Plus,
  Ticket,
  Users,
} from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { CreateDropModal, EditDropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyDrops } from '@/hooks/queries/use-drops';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/ui/components/ui/alert';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button, buttonVariants } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Input } from '@repo/ui/components/ui/input';
import { Separator } from '@repo/ui/components/ui/separator';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/ui/tabs';
import { cn } from '@repo/ui/utils';
import type { Drop, DropStatus } from '@/types/drop';

type StatusMeta = {
  label: string;
  tone: string;
  dot: string;
};

const STATUS_META: Record<DropStatus, StatusMeta> = {
  active: {
    label: 'Active',
    tone: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  ongoing: {
    label: 'Ongoing',
    tone: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    tone: 'bg-[#2a2118]/6 text-[#2a2118]/46 border-[#2a2118]/10',
    dot: 'bg-[#2a2118]/36',
  },
};

const STATUS_STRIPE: Record<DropStatus, string> = {
  active: 'border-l-[#006666]',
  ongoing: 'border-l-[#c47b10]',
  completed: 'border-l-[#2a2118]/18',
};

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

function formatRelativeTime(iso: string) {
  const diffMinutes = Math.round(
    (Date.now() - new Date(iso).getTime()) / 60000,
  );

  if (!Number.isFinite(diffMinutes)) {
    return 'Recently';
  }

  if (Math.abs(diffMinutes) < 1) {
    return 'Just now';
  }

  if (Math.abs(diffMinutes) < 60) {
    return `${Math.abs(diffMinutes)}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)}d ago`;
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

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-syne text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#2a2118]/64">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: DropStatus }) {
  const meta = STATUS_META[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-auto rounded-full px-2.5 py-1 font-syne text-[9px] font-bold uppercase tracking-[2.1px]',
        meta.tone,
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  );
}

function CompactDropCard({
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
  const canEdit = drop.status !== 'completed';

  return (
    <Card
      role="article"
      className={cn(
        'group gap-0 rounded-[24px] border border-l-[5px] border-[#2a2118]/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,249,229,0.64))] p-4 shadow-[0_10px_28px_rgba(42,33,24,0.05)] ring-0 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5',
        STATUS_STRIPE[drop.status],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={drop.status} />
            <span className="font-syne text-[9px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/30">
              {drop.joinCode}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[12px] font-bold tracking-[0.12em] text-[#F7E9B2]">
              {getInitials(drop.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-semibold leading-tight text-[#2a2118]">
                {drop.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-[#2a2118]/56">
                {getRole(drop, viewerId)} view
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-[13px] text-[#2a2118]/64 sm:grid-cols-3">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
              <CalendarDays size={13} className="text-[#2a2118]/40" />
              <span className="truncate">
                {formatDateTime(drop.scheduledAt)}
              </span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
              <MapPin size={13} className="text-[#2a2118]/40" />
              <span className="truncate">{drop.location}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
              <Users size={13} className="text-[#2a2118]/40" />
              <span className="truncate">
                {drop.expectedHeadcount
                  ? `${drop.expectedHeadcount} expected`
                  : 'Headcount not set'}
              </span>
            </span>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#2a2118]/46">
            <Clock3 size={12} className="text-[#2a2118]/34" />
            Updated {formatRelativeTime(drop.updatedAt)}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 border-t border-[#2a2118]/8 pt-4 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <Link
            href={`/drops/${drop.id}`}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-auto flex-1 rounded-full border-[#2a2118]/12 bg-[#F7E9B2] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118] hover:bg-[#FFF2C7] focus-visible:ring-[#006666]/25 focus-visible:ring-offset-white sm:flex-none',
            )}
          >
            Open
            <ArrowUpRight size={13} />
          </Link>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(drop)}
              className="h-auto flex-1 rounded-full border-[#2a2118]/10 bg-transparent px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 hover:border-[#2a2118]/18 hover:bg-transparent hover:text-[#2a2118] focus-visible:ring-[#006666]/25 focus-visible:ring-offset-white sm:flex-none"
            >
              <Edit3 size={13} />
              Edit
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onShare(drop)}
            className="h-auto flex-1 rounded-full border-[#2a2118]/10 bg-white/80 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 hover:border-[#2a2118]/18 hover:bg-white hover:text-[#2a2118] focus-visible:ring-[#006666]/25 focus-visible:ring-offset-white sm:flex-none"
          >
            <ClipboardCopy size={13} />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FocusDropCard({
  drop,
  onShare,
}: {
  drop: Drop;
  onShare: (drop: Drop) => void;
}) {
  return (
    <Card
      role="article"
      className={cn(
        'group gap-0 rounded-[26px] border border-l-[5px] border-[#2a2118]/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,249,229,0.66))] p-4 shadow-[0_12px_32px_rgba(42,33,24,0.06)] ring-0 sm:p-5',
        STATUS_STRIPE[drop.status],
      )}
    >
      {/* Eyebrow */}
      <p className="mb-3 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#006666]">
        Featured drop
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[12px] font-bold tracking-[0.12em] text-[#F7E9B2]">
            {getInitials(drop.name)}
          </div>
          <div className="min-w-0">
            <StatusPill status={drop.status} />
            <h2 className="mt-1.5 truncate font-syne text-[clamp(18px,2vw,24px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
              {drop.name}
            </h2>
          </div>
        </div>

        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <Link
            href={`/drops/${drop.id}`}
            className={cn(
              buttonVariants(),
              'h-auto flex-1 rounded-full border-[#2a2118]/12 bg-[#006666] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#F7E9B2] hover:bg-[#006666]/90 focus-visible:ring-[#006666]/25 sm:flex-none',
            )}
          >
            Open
            <ArrowRight size={13} />
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => onShare(drop)}
            className="h-auto flex-1 rounded-full border-[#2a2118]/10 bg-white/80 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 hover:border-[#2a2118]/18 hover:bg-white hover:text-[#2a2118] focus-visible:ring-[#006666]/25 sm:flex-none"
          >
            <ClipboardCopy size={13} />
            Share
          </Button>
        </div>
      </div>

      <Separator className="mt-4 bg-[#2a2118]/8" />
      <div className="mt-4 grid gap-2 text-[13px] text-[#2a2118]/64 sm:grid-cols-2 lg:grid-cols-4">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
          <CalendarDays size={13} className="text-[#2a2118]/40" />
          <span className="truncate">{formatDateTime(drop.scheduledAt)}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
          <MapPin size={13} className="text-[#2a2118]/40" />
          <span className="truncate">{drop.location}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
          <Users size={13} className="text-[#2a2118]/40" />
          <span className="truncate">
            {drop.organiser.firstName} {drop.organiser.lastName}
          </span>
        </span>
        {drop.expectedHeadcount ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/55 px-3 py-2">
            <Ticket size={13} className="text-[#2a2118]/40" />
            <span className="truncate">{drop.expectedHeadcount} expected</span>
          </span>
        ) : null}
      </div>
    </Card>
  );
}

function GateCard() {
  return (
    <Card className="gap-0 rounded-[24px] border border-[#2a2118]/10 bg-white/72 p-5 shadow-[0_14px_40px_rgba(42,33,24,0.06)] ring-0 sm:rounded-[28px] sm:p-7">
      <CardContent className="px-0">
        <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
          Authentication required
        </p>
        <h2 className="mt-3 font-syne text-[clamp(28px,3.8vw,44px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
          Sign in to manage or join a Drop.
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/login"
            className={cn(
              buttonVariants(),
              'h-auto rounded-full bg-[#006666] px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] hover:bg-[#006666]/90 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-white',
            )}
          >
            <LogIn size={14} />
            Log in
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-auto rounded-full border-[#2a2118]/10 bg-white/75 px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118] hover:border-[#2a2118]/18 hover:bg-white focus-visible:ring-[#006666]/25 focus-visible:ring-offset-white',
            )}
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="gap-0 rounded-[26px] border border-dashed border-[#2a2118]/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,249,229,0.58))] p-5 shadow-[0_14px_40px_rgba(42,33,24,0.04)] ring-0 sm:rounded-[30px] sm:p-7">
      <CardContent className="px-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006666]/10 text-[#006666]">
          <Plus size={22} />
        </div>
        <h2 className="mt-4 font-syne text-[22px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
          No Drops yet
        </h2>
        <p className="mt-3 max-w-lg text-[14px] leading-7 text-[#2a2118]/64">
          Use Quick actions above to create the first plan. TapOk will generate
          the link, QR, and join code the moment it goes live.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyStateSkeleton() {
  return (
    <Card className="gap-0 rounded-[26px] border border-dashed border-[#2a2118]/14 bg-white/58 p-5 shadow-[0_14px_40px_rgba(42,33,24,0.04)] ring-0 sm:rounded-[30px] sm:p-7">
      <CardContent className="px-0">
        <Skeleton className="h-12 w-12 rounded-full bg-[#006666]/10" />
        <Skeleton className="mt-5 h-6 w-44 rounded bg-[#2a2118]/10" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-3 w-full max-w-md rounded-full bg-[#2a2118]/8" />
          <Skeleton className="h-3 w-4/5 max-w-sm rounded-full bg-[#2a2118]/8" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Mirrors the FocusDropCard layout — same container as CompactDropCardSkeleton */
function FocusDropCardSkeleton() {
  return (
    <Card className="gap-0 rounded-[26px] border border-l-[5px] border-l-[#2a2118]/12 border-[#2a2118]/10 bg-white/70 p-4 shadow-[0_12px_32px_rgba(42,33,24,0.06)] ring-0 sm:p-5">
      {/* Eyebrow */}
      <Skeleton className="mb-3 h-2.5 w-20 rounded-full bg-[#006666]/15" />
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-[#2a2118]/10" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-16 rounded-full bg-[#2a2118]/10" />
            <Skeleton className="h-6 w-44 rounded bg-[#2a2118]/10" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-8 w-20 rounded-full bg-[#2a2118]/8" />
          <Skeleton className="h-8 w-20 rounded-full bg-[#2a2118]/8" />
        </div>
      </div>
      {/* Meta row */}
      <div className="mt-4 grid gap-2 border-t border-[#2a2118]/8 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
        <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
        <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
        <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
      </div>
    </Card>
  );
}

/** Mirrors the CompactDropCard layout */
function CompactDropCardSkeleton() {
  return (
    <Card className="gap-0 rounded-[24px] border border-l-[5px] border-l-[#2a2118]/12 border-[#2a2118]/10 bg-white/70 p-4 shadow-[0_10px_28px_rgba(42,33,24,0.05)] ring-0 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: status pill + name block + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full bg-[#2a2118]/8" />
            <Skeleton className="h-3 w-10 rounded-full bg-[#2a2118]/6" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-[#2a2118]/10" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded bg-[#2a2118]/10" />
              <Skeleton className="h-3 w-20 rounded-full bg-[#2a2118]/6" />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
            <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
            <Skeleton className="h-8 rounded-full bg-[#2a2118]/8" />
          </div>
          <Skeleton className="mt-3 h-3 w-20 rounded-full bg-[#2a2118]/6" />
        </div>
        {/* Right: action buttons */}
        <div className="flex w-full flex-wrap gap-2 border-t border-[#2a2118]/8 pt-4 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <Skeleton className="h-8 flex-1 rounded-full bg-[#2a2118]/8 sm:w-20 sm:flex-none" />
          <Skeleton className="h-8 flex-1 rounded-full bg-[#2a2118]/6 sm:w-16 sm:flex-none" />
          <Skeleton className="h-8 flex-1 rounded-full bg-[#2a2118]/6 sm:w-20 sm:flex-none" />
        </div>
      </div>
    </Card>
  );
}

function QuickActionsSkeleton() {
  return (
    <Card className="gap-0 rounded-[24px] border border-[#2a2118]/10 bg-white/40 p-4 shadow-[0_14px_34px_rgba(42,33,24,0.06)] ring-0 sm:rounded-[30px] sm:p-5">
      <Skeleton className="h-3 w-28 rounded-full bg-[#006666]/16" />
      <div className="mt-4 grid gap-3">
        <Skeleton className="h-[66px] rounded-[20px] bg-[#006666]/18" />
        <div className="rounded-[20px] border border-[#2a2118]/10 bg-white/50 p-4">
          <Skeleton className="h-2.5 w-20 rounded-full bg-[#2a2118]/10" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-full bg-[#2a2118]/8" />
            <Skeleton className="h-10 w-14 rounded-full bg-[#2a2118]/12" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Mirrors the tab panel + cards section */
function BoardSkeleton({ variant = 'list' }: { variant?: 'empty' | 'list' }) {
  if (variant === 'empty') {
    return <EmptyStateSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Focus card skeleton */}
      <FocusDropCardSkeleton />

      {/* Tab panel skeleton */}
      <Card className="gap-0 rounded-[28px] border border-[#2a2118]/10 bg-white/58 p-5 shadow-[0_12px_34px_rgba(42,33,24,0.05)] ring-0">
        {/* Tab bar */}
        <div className="flex gap-6 border-b border-[#2a2118]/8 pb-3">
          <Skeleton className="h-3 w-12 rounded-full bg-[#2a2118]/12" />
          <Skeleton className="h-3 w-20 rounded-full bg-[#2a2118]/8" />
        </div>
        {/* Card rows */}
        <div className="mt-4 space-y-3">
          <CompactDropCardSkeleton />
          <CompactDropCardSkeleton />
        </div>
      </Card>
    </div>
  );
}

function DropsPageSkeleton({
  boardVariant = 'list',
}: {
  boardVariant?: 'empty' | 'list';
}) {
  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
      <TapokNavbar />
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="flex flex-col justify-center gap-4">
            <Skeleton className="h-12 w-64 rounded bg-[#2a2118]/10" />
            <Skeleton className="h-4 w-72 max-w-full rounded-full bg-[#2a2118]/8" />
          </div>
          <QuickActionsSkeleton />
        </section>
        <section className="space-y-4">
          <BoardSkeleton variant={boardVariant} />
        </section>
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
  const [activeTab, setActiveTab] = useState<'live' | 'completed'>('live');

  const sortedUpcoming = useMemo(() => [...drops].sort(sortUpcoming), [drops]);
  const activeDrops = useMemo(
    () =>
      sortedUpcoming.filter(
        (drop) => drop.status === 'active' || drop.status === 'ongoing',
      ),
    [sortedUpcoming],
  );
  const completedDrops = useMemo(
    () =>
      [...drops].filter((drop) => drop.status === 'completed').sort(sortRecent),
    [drops],
  );
  const focusDrop = activeDrops[0] ?? sortedUpcoming[0] ?? null;

  const liveTabDrops = useMemo(
    () =>
      focusDrop &&
      (focusDrop.status === 'active' || focusDrop.status === 'ongoing')
        ? activeDrops.filter((d) => d.id !== focusDrop.id)
        : activeDrops,
    [activeDrops, focusDrop],
  );

  const plannedHeadcount = drops.reduce(
    (sum, drop) => sum + (drop.expectedHeadcount ?? 0),
    0,
  );
  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    router.push(`/drops/join/${code}`);
  };

  const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleJoin();
  };

  const handleTabChange = (value: string | number | null) => {
    if (value === 'live' || value === 'completed') {
      setActiveTab(value);
    }
  };

  if (!isReady) {
    return <DropsPageSkeleton />;
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
            <SectionTitle
              eyebrow="Drops"
              title="One Drop. One Crew."
              description="TapOk is where a plan becomes real. Sign in to create a Drop, join a Crew, and keep the log in one place."
            />
            <GateCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(0,102,102,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(42,33,24,0.08),transparent_28%)]" />

      <TapokNavbar />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <section className="mb-6 grid gap-4 sm:mb-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="flex flex-col justify-center gap-4">
            <div>
              <h1 className="font-syne text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
                Your Drops
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[#2a2118]/56">
                Plan the meetup. Share the drop. Live the moment.
              </p>
            </div>
            {drops.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="h-auto gap-2 rounded-full border-[#2a2118]/10 bg-white/70 px-3 py-1.5 text-[13px] font-normal"
                >
                  <Users size={13} className="text-[#006666]" />
                  <span className="font-semibold text-[#2a2118]">
                    {plannedHeadcount}
                  </span>
                  <span className="text-[#2a2118]/52">crew reached</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="h-auto gap-2 rounded-full border-[#2a2118]/10 bg-white/70 px-3 py-1.5 text-[13px] font-normal"
                >
                  <CalendarDays size={13} className="text-[#006666]" />
                  <span className="font-semibold text-[#2a2118]">
                    {drops.length}
                  </span>
                  <span className="text-[#2a2118]/52">
                    {drops.length === 1 ? 'drop' : 'drops'} created
                  </span>
                </Badge>
                {activeDrops.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-auto gap-2 rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[13px] font-normal"
                  >
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-semibold text-emerald-800">
                      {activeDrops.length}
                    </span>
                    <span className="text-emerald-700/70">live now</span>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Card className="gap-0 rounded-[24px] border border-[#2a2118]/10 bg-[linear-gradient(135deg,rgba(255,249,229,0.96),rgba(255,241,196,0.78))] p-4 shadow-[0_14px_34px_rgba(42,33,24,0.06)] ring-0 sm:rounded-[30px] sm:p-5">
            <CardContent className="px-0">
              <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
                Quick actions
              </p>
              <div className="mt-4 grid gap-3">
                <Button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="group h-auto w-full justify-between rounded-[20px] bg-[#006666] px-5 py-4 hover:bg-[#006666]/90 focus-visible:ring-[#006666]/25"
                >
                  <div>
                    <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2]/50">
                      Create
                    </p>
                    <p className="mt-0.5 font-syne text-[16px] font-bold uppercase tracking-[-0.02em] text-[#F7E9B2]">
                      New Drop
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7E9B2]/15 transition-transform group-hover:scale-105">
                    <Plus size={16} className="text-[#F7E9B2]" />
                  </div>
                </Button>
                <Card className="gap-0 rounded-[20px] border border-[#2a2118]/10 bg-white/72 p-4 ring-0">
                  <CardContent className="px-0">
                    <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                      Got a code?
                    </p>
                    <form
                      onSubmit={handleJoinSubmit}
                      className="mt-3 flex gap-2"
                    >
                      <Input
                        value={joinCode}
                        onChange={(event) =>
                          setJoinCode(event.target.value.toUpperCase())
                        }
                        placeholder="ENTER CODE"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck="false"
                        className="h-10 min-w-0 flex-1 rounded-full border-[#2a2118]/10 bg-white/90 px-4 font-syne text-[11px] font-bold tracking-[2.2px] text-[#2a2118] placeholder:text-[#2a2118]/24 focus-visible:border-[#006666]/35 focus-visible:ring-[#006666]/20"
                      />
                      <Button
                        type="submit"
                        className="h-10 rounded-full bg-[#2a2118] px-4 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] hover:bg-[#2a2118]/90"
                      >
                        Go
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 sm:space-y-6">
          {loading || isHardLoading ? (
            <BoardSkeleton variant="list" />
          ) : isError ? (
            <Alert className="rounded-[28px] border-[#2a2118]/10 bg-white/72 p-6 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
              <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
                Something slipped
              </p>
              <AlertTitle className="mt-3 font-syne text-[24px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
                We could not load your Drops.
              </AlertTitle>
              <AlertDescription className="mt-3 max-w-xl text-[14px] leading-7 text-[#2a2118]/64">
                Try again in a moment. Your session may need a refresh if this
                keeps happening.
              </AlertDescription>
            </Alert>
          ) : drops.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {activeTab === 'live' &&
                focusDrop &&
                focusDrop.status !== 'completed' && (
                  <FocusDropCard drop={focusDrop} onShare={handleShare} />
                )}

              <Card
                className={`gap-0 rounded-[24px] border border-[#2a2118]/10 p-4 shadow-[0_12px_34px_rgba(42,33,24,0.05)] ring-0 transition-colors duration-300 sm:rounded-[28px] sm:p-5 ${activeTab === 'completed' ? 'bg-white/48' : 'bg-white/58'}`}
              >
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList
                    variant="line"
                    className="w-full justify-start border-b border-[#2a2118]/8 p-0"
                  >
                    <TabsTrigger
                      value="live"
                      className="relative flex-none gap-2 rounded-none pb-3 pr-6 font-syne text-[11px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/38 hover:text-[#2a2118]/70 data-active:text-[#2a2118] data-active:after:bg-[#006666]"
                    >
                      <span className="relative">
                        Live
                        {activeDrops.length > 0 && activeTab !== 'live' && (
                          <span className="absolute -right-2 -top-0.5 flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'h-auto rounded-full border-0 px-1.5 py-0.5 text-[9px] font-bold leading-none',
                          activeTab === 'live'
                            ? 'bg-[#2a2118]/8 text-[#2a2118]'
                            : 'bg-[#2a2118]/6 text-[#2a2118]/36',
                        )}
                      >
                        {activeDrops.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="relative flex-none gap-2 rounded-none pb-3 pr-6 font-syne text-[11px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/38 hover:text-[#2a2118]/70 data-active:text-[#2a2118] data-active:after:bg-[#006666]"
                    >
                      Completed
                      <Badge
                        variant="outline"
                        className={cn(
                          'h-auto rounded-full border-0 px-1.5 py-0.5 text-[9px] font-bold leading-none',
                          activeTab === 'completed'
                            ? 'bg-[#2a2118]/8 text-[#2a2118]'
                            : 'bg-[#2a2118]/6 text-[#2a2118]/36',
                        )}
                      >
                        {completedDrops.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="live" className="mt-4 space-y-3">
                    {liveTabDrops.length > 0 ? (
                      liveTabDrops.map((drop) => (
                        <CompactDropCard
                          key={drop.id}
                          drop={drop}
                          viewerId={dbUser?.id}
                          onShare={handleShare}
                          onEdit={setEditDrop}
                        />
                      ))
                    ) : focusDrop && focusDrop.status !== 'completed' ? (
                      <p className="py-3 text-center font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                        Only one live drop — featured above
                      </p>
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[#2a2118]/14 bg-white/65 p-5 text-center">
                        <p className="font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                          Nothing live right now
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-[#2a2118]/58">
                          Create the next Drop and it will appear here as soon
                          as it goes active.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    <div
                      className={
                        completedDrops.length > 0
                          ? 'space-y-3 opacity-80'
                          : undefined
                      }
                    >
                      {completedDrops.length > 0 ? (
                        completedDrops.map((drop) => (
                          <CompactDropCard
                            key={drop.id}
                            drop={drop}
                            viewerId={dbUser?.id}
                            onShare={handleShare}
                            onEdit={setEditDrop}
                          />
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#2a2118]/14 bg-white/65 p-5 text-center">
                          <p className="font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                            No completed Drops yet
                          </p>
                          <p className="mt-2 text-[13px] leading-6 text-[#2a2118]/58">
                            Finished plans will collect here with their logs and
                            share links.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </>
          )}
        </section>
      </main>

      {shareModalDrop && (
        <DropShareModal
          drop={shareModalDrop}
          onClose={() => setShareModalDrop(null)}
        />
      )}
      {createModalOpen && (
        <CreateDropModal onClose={() => setCreateModalOpen(false)} />
      )}
      {editDrop && (
        <EditDropModal drop={editDrop} onClose={() => setEditDrop(null)} />
      )}
    </div>
  );
}
