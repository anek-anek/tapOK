'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarDays,
  Edit3,
  Lock,
  MapPin,
  Users,
  Share,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrewMember, Drop, DropCardModel } from '@/types/drop';
import { Skeleton } from '@/components/ui/skeleton';
import { SparkButton } from './spark-button';

export function crewFor(drop: DropCardModel): CrewMember[] | undefined {
  if (!('crew' in drop) || !drop.crew) return undefined;
  return drop.crew.filter((m) => m.status === 'in');
}

function isShareableDrop(drop: DropCardModel): drop is Drop {
  return typeof (drop as Drop).joinCode === 'string' && typeof (drop as Drop).shareUrl === 'string';
}

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

export function getRole(drop: DropCardModel, userId?: string | null) {
  return userId && drop.organiserId === userId ? 'Chief' : 'Crew';
}

function getCrewMemberDisplay(member: CrewMember) {
  const firstName = member.user?.firstName?.trim() || 'Crew';
  const lastName = member.user?.lastName?.trim() || '';
  const avatar = member.user?.avatar || undefined;
  const initials = `${firstName[0] || 'C'}${lastName[0] || ''}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  return { firstName, lastName, avatar, initials, fullName };
}

/** The dark teal "Next Up" hero card pinned at the top of the board */
export function HeroDropCard({
  drop,
  viewerId,
  onShare,
}: {
  drop: DropCardModel;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const crew = crewFor(drop);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShareableDrop(drop)) onShare?.(drop);
  };

  return (
    <div className="group relative">
      <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal shadow-[8px_8px_0px_#1C1C1A] transition-all group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[12px_12px_0px_#1C1C1A] md:flex-row">

        {/* Visual Section */}
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black md:aspect-square md:w-[280px] md:border-b-0 md:border-r-[3px]">
          {drop.coverPhoto ? (
            <Image
              src={drop.coverPhoto}
              alt={drop.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

          ) : (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-tok-black/10 font-passion text-5xl font-bold tracking-widest text-tok-cream/10">
              {getInitials(drop.name)}
            </div>
          )}

          {/* Status Badge overlay */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-400 px-2 py-1 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tok-black opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tok-black" />
              </span>
              {drop.status === 'ongoing' ? 'Ongoing' : 'Next Drop'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative flex flex-1 flex-col p-5 md:p-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-amber-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                {role}
              </span>
              {drop.category && (
                <span className="rounded-sm bg-tok-black/20 px-1.5 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                  {drop.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tok-cream/30 bg-tok-black/20">
                {drop.organiser?.avatar ? (
                  <Image src={drop.organiser.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-passion text-[9px] text-tok-cream">
                    {drop.organiser?.firstName?.[0] || '?'}{drop.organiser?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-cream [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
                CHIEF {drop.organiser?.firstName} {drop.organiser?.lastName}
              </p>
            </div>

            <h2 className="font-passion text-2xl font-bold leading-tight tracking-tight text-tok-cream [text-shadow:0_2px_8px_rgba(0,0,0,0.35)] md:text-3xl">
              {drop.name}
            </h2>
          </div>

          {drop.overview && (
            <p className="font-inter text-sm leading-relaxed text-tok-cream/92 line-clamp-2 max-w-lg mb-4 [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
              {drop.overview}
            </p>
          )}

          {/* Crew Section */}
          {crew && crew.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center">
                {crew.slice(0, 4).map((member, i) => {
                  const display = getCrewMemberDisplay(member);
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "relative h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden",
                        i > 0 && "-ml-4"
                      )}
                    >
                      {display.avatar ? (
                        <Image src={display.avatar} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-passion text-[10px] text-tok-teal">
                          {display.initials}
                        </div>
                      )}
                    </div>
                  );
                })}
                {crew.length > 4 && (
                  <div className="relative -ml-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion text-[10px] font-bold text-tok-black">
                    +{crew.length - 4}
                  </div>
                )}
              </div>


              <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                {crew.length} in the crew
              </span>
            </div>
          )}

          {/* Footer Grid */}
          <div className="mt-auto grid grid-cols-1 gap-3 border-t border-dashed border-tok-cream/20 pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={16} className="shrink-0 text-tok-cream/85" strokeWidth={2.5} />
              <span className="font-passion text-xs font-bold uppercase tracking-wider text-tok-cream [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] sm:text-[13px]">
                {formatDateTime(drop.scheduledAt)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin size={16} className="shrink-0 text-tok-cream/85" strokeWidth={2.5} />
              <span className="truncate font-passion text-xs font-bold uppercase tracking-wider text-tok-cream [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] sm:text-[13px]">
                {drop.location}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/drops/${drop.id}`}
              className="flex h-10 items-center justify-center gap-2.5 rounded-sm border-2 border-tok-black bg-tok-cream px-6 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-teal transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
            >
              Open Drop
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Absolute Quick Actions */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
        <SparkButton drop={drop} variant="hero" />
      </div>

      <div className="absolute left-4 top-4 z-20 flex gap-2 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
        {onShare && isShareableDrop(drop) && (
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-cream text-tok-teal shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:bg-tok-cream-dim active:translate-y-0 active:shadow-none"
            title="Share Drop"
          >
            <Share size={18} strokeWidth={3} />
          </button>
        )}
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
  onDelete,
  showShareEditDelete = true,
}: {
  drop: DropCardModel;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  onEdit?: (drop: Drop) => void;
  onDelete?: (drop: Drop) => void;
  showShareEditDelete?: boolean;
}) {
  const role = getRole(drop, viewerId);
  const crew = crewFor(drop);
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed' && isShareableDrop(drop);
  const canDelete = isOrganiser && onDelete && isShareableDrop(drop);
  const isCompleted = drop.status === 'completed';

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShareableDrop(drop)) onShare?.(drop);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShareableDrop(drop)) onEdit?.(drop);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShareableDrop(drop)) onDelete?.(drop);
  };

  return (
    <div className="group relative mt-4">
      <Link
        href={`/drops/${drop.id}`}
        className={cn(
          'flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black transition-all sm:flex-row',
          isCompleted
            ? 'bg-tok-black/5 opacity-70 grayscale'
            : 'bg-white shadow-[4px_4px_0px_#1C1C1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]',
        )}
      >
        {/* Visual Element */}
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black sm:aspect-square sm:w-32 sm:border-b-0 sm:border-r-[3px]">
          {drop.coverPhoto ? (
            <Image
              src={drop.coverPhoto}
              alt={drop.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-tok-teal/10 font-passion text-2xl font-bold tracking-widest text-tok-teal/30">
              {getInitials(drop.name)}
            </div>
          )}


          {/* Status Badge overlay */}
          {drop.status === 'ongoing' && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-amber-400 px-1.5 py-0.5 font-passion text-[8px] font-bold uppercase tracking-wider text-tok-black border-2 border-tok-black shadow-[1.5px_1.5px_0px_#1C1C1A]">
              <span className="relative flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tok-black opacity-75" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-tok-black" />
              </span>
              Ongoing
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black/50">
              {role}
            </span>
            {drop.category && (
              <span className="rounded-sm bg-tok-teal-pale px-2 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-tok-teal border border-tok-teal/20">
                {drop.category}
              </span>
            )}
            {!drop.isPublic && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-tok-black/5 px-2 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-tok-black/50">
                <Lock size={10} strokeWidth={3} />
                Private
              </span>
            )}
          </div>

          <h3
            className={cn(
              'font-passion text-2xl font-bold leading-snug text-tok-black group-hover:text-tok-teal transition-colors mb-2.5 sm:text-[26px]',
              showShareEditDelete ? 'pr-10 sm:pr-0' : '',
            )}
          >
            {drop.name}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-tok-black/55 mb-3.5 sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="shrink-0 text-tok-teal" strokeWidth={2.5} />
              <span className="font-passion uppercase tracking-[0.06em]">{formatDateTime(drop.scheduledAt)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin size={14} className="shrink-0 text-tok-teal" strokeWidth={2.5} />
              <span className="font-passion truncate uppercase tracking-[0.06em] max-w-[180px] sm:max-w-[220px]">
                {drop.location}
              </span>
            </span>
          </div>

          {drop.overview && (
            <p className="font-inter text-sm leading-relaxed text-tok-black/72 line-clamp-2 mb-4 sm:text-[15px] sm:leading-relaxed">
              {drop.overview}
            </p>
          )}

          {/* Crew Section */}
          <div className="mt-auto flex items-center gap-2">
            <div className="flex items-center">
              {crew && crew.length > 0 ? (
                <>
                  {crew.slice(0, 3).map((member, i) => {
                    const display = getCrewMemberDisplay(member);
                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "relative h-6 w-6 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden",
                          i > 0 && "-ml-3"
                        )}
                        title={display.fullName}
                      >
                        {display.avatar ? (
                          <Image src={display.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-passion text-[8px] text-tok-teal">
                            {display.initials}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {crew.length > 3 && (
                    <div className="relative -ml-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion text-[8px] font-bold text-tok-black">
                      +{crew.length - 3}
                    </div>
                  )}
                </>
              ) : (


                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-tok-black border-dashed bg-tok-black/5 text-tok-black/20">
                  <Users size={10} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-tok-black/10 mx-1" />

            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal-pale">
                {drop.organiser?.avatar ? (
                  <Image src={drop.organiser.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-passion text-[8px] text-tok-teal">
                    {drop.organiser?.firstName?.[0] || '?'}{drop.organiser?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <p className="font-passion text-[11px] font-bold uppercase tracking-[0.08em] text-tok-black/65 sm:text-xs">
                Chief {drop.organiser?.firstName}
              </p>
            </div>
          </div>
        </div>
      </Link>


      {/* Quick Action Buttons */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
        <SparkButton drop={drop} className="bg-white" />
      </div>

      {showShareEditDelete && (
        <div className="absolute left-4 top-4 z-20 flex gap-2 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          {onShare && !isCompleted && isShareableDrop(drop) && (
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0 active:shadow-none"
              title="Share Drop"
            >
              <Share size={16} strokeWidth={2.5} />
            </button>
          )}
          {canEdit && onEdit && (
            <button
              onClick={handleEdit}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0 active:shadow-none"
              title="Edit Drop"
            >
              <Edit3 size={16} strokeWidth={2.5} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-red-500 shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-0 active:shadow-none"
              title="Delete Drop"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="group relative">
      <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal shadow-[8px_8px_0px_#1C1C1A] md:flex-row">
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black md:aspect-square md:w-[280px] md:border-b-0 md:border-r-[3px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-tok-black/20" />
          <div className="pointer-events-none absolute bottom-3 left-3">
            <Skeleton className="h-7 w-30 rounded-sm border-2 border-tok-black bg-amber-400/70 shadow-[2px_2px_0px_#1C1C1A]" />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-5 md:p-6">
          <div className="mb-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-3 w-14 rounded-sm bg-tok-cream/25" />
              <Skeleton className="h-5 w-18 rounded-sm border border-amber-400/30 bg-tok-black/25" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full border border-tok-cream/30 bg-tok-black/25" />
              <Skeleton className="h-3 max-w-[220px] flex-1 rounded-sm bg-tok-cream/30" />
            </div>
            <Skeleton className="h-9 max-w-xl rounded-sm bg-tok-cream/25" />
            <Skeleton className="h-4 max-w-lg rounded-sm bg-tok-cream/20" />
            <Skeleton className="h-4 max-w-md rounded-sm bg-tok-cream/15" />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale/70" />
              <Skeleton className="-ml-4 h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale/55" />
              <Skeleton className="-ml-4 h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale/45" />
            </div>
            <Skeleton className="h-3 w-28 rounded-sm bg-tok-cream/25" />
          </div>

          <div className="mt-auto grid grid-cols-1 gap-3 border-t border-dashed border-tok-cream/20 pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm bg-tok-cream/35" />
              <Skeleton className="h-4 flex-1 rounded-sm bg-tok-cream/25" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm bg-tok-cream/35" />
              <Skeleton className="h-4 flex-1 rounded-sm bg-tok-cream/25" />
            </div>
          </div>

          <div className="mt-6">
            <Skeleton className="h-10 w-44 rounded-sm border-2 border-tok-black bg-tok-cream/50 shadow-[3px_3px_0px_#1C1C1A]" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-20">
        <Skeleton className="h-11 w-11 rounded-md border-[3px] border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A]" />
      </div>
    </div>
  );
}

export function ListCardSkeleton() {
  return (
    <div className="group relative mt-4">
      <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black sm:aspect-square sm:w-32 sm:border-b-0 sm:border-r-[3px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-tok-teal/15" />
          <div className="pointer-events-none absolute bottom-2 left-2 sm:bottom-2 sm:left-2">
            <Skeleton className="h-5 w-16 rounded-sm border border-tok-black/30 bg-amber-400/60" />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Skeleton className="h-2.5 w-14 rounded-sm bg-tok-black/15" />
            <Skeleton className="h-5 w-17 rounded-sm bg-tok-teal-pale/80" />
          </div>

          <Skeleton className="mb-2.5 h-8 max-w-md rounded-sm bg-tok-black/10" />

          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
            <Skeleton className="h-4 w-44 rounded-sm bg-tok-black/10" />
            <Skeleton className="h-4 w-36 rounded-sm bg-tok-black/10" />
          </div>

          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-full max-w-xl rounded-sm bg-tok-black/8" />
            <Skeleton className="h-4 w-full max-w-lg rounded-sm bg-tok-black/8" />
          </div>

          <div className="mt-auto flex items-center gap-2">
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 rounded-full border-2 border-tok-black bg-tok-teal-pale/70" />
              <Skeleton className="-ml-3 h-6 w-6 rounded-full border-2 border-tok-black bg-tok-teal-pale/55" />
              <Skeleton className="-ml-3 h-6 w-6 rounded-full border-2 border-tok-black bg-tok-teal-pale/45" />
            </div>
            <div className="mx-1 h-4 w-px bg-tok-black/10" />
            <Skeleton className="h-6 w-6 shrink-0 rounded-full border-2 border-tok-black bg-tok-teal-pale/70" />
            <Skeleton className="h-3 w-28 rounded-sm bg-tok-black/12" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-20">
        <Skeleton className="h-10 w-10 rounded-md border-2 border-tok-black bg-white shadow-[2px_2px_0px_#1C1C1A]" />
      </div>
    </div>
  );
}


