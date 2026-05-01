'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ClipboardCopy,
  Edit3,
  Lock,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Drop } from '@/types/drop';
import { Skeleton } from '@/components/ui/skeleton';

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'D'
  );
}

export function getRole(drop: Drop, userId?: string | null) {
  return userId && drop.organiserId === userId ? 'Chief' : 'Crew';
}

/** The dark teal "Next Up" hero card pinned at the top of the board */
export function HeroDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
}: {
  drop: Drop;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  onEdit?: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed' && onEdit;

  return (
    <div className="relative overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal px-6 py-6 shadow-[8px_8px_0px_#1C1C1A]">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-tok-cream/20 bg-tok-cream/10 font-passion text-xl font-bold tracking-widest text-tok-cream">
            {getInitials(drop.name)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-passion text-[10px] font-bold uppercase tracking-[3px] text-amber-400">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                {drop.status === 'ongoing' ? 'Ongoing Now' : 'Next Drop'}
              </span>
              {!drop.isPublic && (
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-tok-black/20 px-2 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-tok-cream">
                  <Lock size={10} strokeWidth={3} />
                  Private
                </span>
              )}
              {drop.category && (
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-tok-black/20 px-2 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/30">
                  {drop.category}
                </span>
              )}
            </div>
            <h2 className="mt-1 font-passion text-3xl font-bold leading-none tracking-tight text-tok-cream">
              {drop.name}
            </h2>
            <p className="mt-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[3px] text-tok-cream/40">
              {role} • <span className="text-tok-cream/60">{drop.joinCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onShare && (
            <button
              onClick={() => onShare(drop)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-cream/20 bg-tok-cream/10 text-tok-cream transition-all hover:-translate-y-0.5 hover:bg-tok-cream/20 active:translate-y-0"
            >
              <ClipboardCopy size={16} strokeWidth={2.5} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(drop)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-cream/20 bg-tok-cream/10 text-tok-cream transition-all hover:-translate-y-0.5 hover:bg-tok-cream/20 active:translate-y-0"
            >
              <Edit3 size={16} strokeWidth={2.5} />
            </button>
          )}
          <Link
            href={`/drops/${drop.id}`}
            className="flex h-10 items-center justify-center gap-2.5 rounded-sm border-2 border-tok-black bg-tok-cream px-5 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-teal transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
          >
            <span className="pt-0.5">Open Drop</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 border-t-2 border-dashed border-tok-cream/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={14} className="text-tok-cream/60" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-cream/60">{formatDateTime(drop.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-tok-cream/60" strokeWidth={2.5} />
          <span className="font-passion truncate text-[11px] font-bold uppercase tracking-wider text-tok-cream/60">{drop.location}</span>
        </div>
        <div className="flex items-center gap-3">
          <Users size={14} className="text-tok-cream/60" strokeWidth={2.5} />
          <span className="font-passion truncate text-[11px] font-bold uppercase tracking-wider text-tok-cream/60">{drop.organiser.firstName} {drop.organiser.lastName}</span>
        </div>
        {drop.expectedHeadcount ? (
          <div className="flex items-center gap-3">
            <Ticket size={14} className="text-tok-cream/60" strokeWidth={2.5} />
            <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-cream/60">{drop.expectedHeadcount} CREW EXPECTED</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Compact list card for the UPCOMING/PAST tabs */
export function ListDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
}: {
  drop: Drop;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  onEdit?: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed' && onEdit;
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
      <div className="flex items-start gap-4 flex-1">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black font-passion text-sm font-bold tracking-widest',
            isCompleted
              ? 'bg-tok-black/10 text-tok-black/40'
              : 'bg-tok-teal text-tok-cream',
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
            {drop.status === 'ongoing' && (
              <span className="flex items-center gap-1 font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-amber-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                </span>
                • Ongoing
              </span>
            )}
            {!drop.isPublic && (
              <span className="font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-tok-teal/40">
                • PRIVATE
              </span>
            )}
            {drop.category && (
              <span className="font-passion text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[2px] text-tok-teal/40">
                • {drop.category}
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

      <div className="flex items-center justify-end gap-2 sm:shrink-0">
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onEdit(drop)}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0"
            >
              <Edit3 size={14} strokeWidth={2.5} />
            </button>
          )}
          {onShare && !isCompleted && (
            <button
              onClick={() => onShare(drop)}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0"
            >
              <ClipboardCopy size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <Link
          href={`/drops/${drop.id}`}
          className="flex h-9 items-center gap-2 rounded-sm border-2 border-tok-black bg-tok-teal px-4 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-cream transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          View
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border-[3px] border-tok-black/10 bg-tok-teal/10 px-6 py-6 shadow-[8px_8px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-20 rounded-sm bg-tok-black/10" />
              <Skeleton className="h-3.5 w-14 rounded-sm bg-tok-black/10 opacity-50" />
            </div>
            <Skeleton className="h-9 w-3/4 max-w-[320px] rounded-sm bg-tok-black/5" />
            <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/10" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
          <Skeleton className="h-10 w-32 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 border-t-2 border-dashed border-tok-black/5 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/5" />
        <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/5" />
        <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/5" />
        <Skeleton className="h-3 w-32 rounded-sm bg-tok-black/5" />
      </div>
    </div>
  );
}

export function ListCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border-[3px] border-tok-black/10 bg-white/40 p-5 mt-4">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="h-12 w-12 shrink-0 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-12 rounded-sm bg-tok-black/10" />
            <Skeleton className="h-2.5 w-16 rounded-sm bg-tok-black/10 opacity-50" />
          </div>
          <Skeleton className="h-7 w-3/4 max-w-[240px] rounded-sm bg-tok-black/5" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24 rounded-sm bg-tok-black/10 opacity-50" />
            <Skeleton className="h-3 w-24 rounded-sm bg-tok-black/10 opacity-50" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0 justify-end">
        <Skeleton className="h-9 w-9 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
        <Skeleton className="h-9 w-20 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
      </div>
    </div>
  );
}
