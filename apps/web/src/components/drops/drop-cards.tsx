'use client';

import Link from 'next/link';
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

/** The dark teal "Next Up" hero card pinned at the top of the board */
export function HeroDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
  onDelete,
}: {
  drop: DropCardModel;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  onEdit?: (drop: Drop) => void;
  onDelete?: (drop: Drop) => void;
}) {
  const role = getRole(drop, viewerId);
  const crew = crewFor(drop);
  const isOrganiser = !!viewerId && drop.organiserId === viewerId;
  const canEdit = isOrganiser && drop.status !== 'completed' && isShareableDrop(drop);
  const canDelete = isOrganiser && onDelete && isShareableDrop(drop);

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
    <div className="group relative">
      <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal shadow-[8px_8px_0px_#1C1C1A] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#1C1C1A] md:flex-row">

        {/* Visual Section */}
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black md:aspect-square md:w-[280px] md:border-b-0 md:border-r-[3px]">
          {drop.coverPhoto ? (
            <img
              src={drop.coverPhoto}
              alt={drop.name}
              className="absolute inset-0 h-full w-full object-cover"
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
              <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-amber-400/80">
                {role}
                {'joinCode' in drop && drop.joinCode ? (
                  <>
                    {' • '}
                    <span className="text-tok-cream">{drop.joinCode}</span>
                  </>
                ) : null}
              </span>
              {drop.category && (
                <span className="rounded-sm bg-tok-black/20 px-1.5 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/30">
                  {drop.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tok-cream/30 bg-tok-black/20">
                {drop.organiser?.avatar ? (
                  <img src={drop.organiser.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-passion text-[9px] text-tok-cream">
                    {drop.organiser?.firstName?.[0] || '?'}{drop.organiser?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-cream/90">
                CHIEF {drop.organiser?.firstName} {drop.organiser?.lastName}
              </p>
            </div>

            <h2 className="font-passion text-2xl font-bold leading-tight tracking-tight text-tok-cream md:text-3xl">
              {drop.name}
            </h2>
          </div>

          {drop.overview && (
            <p className="font-inter text-xs leading-relaxed text-tok-cream/70 line-clamp-2 max-w-lg mb-4">
              {drop.overview}
            </p>
          )}

          {/* Crew Section */}
          {crew && crew.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center">
                {crew.slice(0, 4).map((member, i) => (
                  <div
                    key={member.id}
                    className={cn(
                      "relative h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden",
                      i > 0 && "-ml-4"
                    )}
                  >
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-passion text-[10px] text-tok-teal">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                    )}
                  </div>
                ))}
                {crew.length > 4 && (
                  <div className="relative -ml-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion text-[10px] font-bold text-tok-black">
                    +{crew.length - 4}
                  </div>
                )}
              </div>


              <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream/60">
                {crew.length} in the crew
              </span>
            </div>
          )}

          {/* Footer Grid */}
          <div className="mt-auto grid grid-cols-1 gap-3 border-t border-dashed border-tok-cream/20 pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={14} className="text-tok-cream/60" strokeWidth={2.5} />
              <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream">{formatDateTime(drop.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-tok-cream/60" strokeWidth={2.5} />
              <span className="font-passion truncate text-[10px] font-bold uppercase tracking-wider text-tok-cream">{drop.location}</span>
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
        <SparkButton drop={drop} variant="hero" className="shadow-[3px_3px_0px_#1C1C1A]" />
      </div>

      <div className="absolute left-4 top-4 z-20 flex gap-2 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
        {onShare && isShareableDrop(drop) && (
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-cream text-tok-teal shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:bg-tok-cream/90 active:translate-y-0 active:shadow-none"
            title="Share Drop"
          >
            <Share size={18} strokeWidth={3} />
          </button>
        )}
        {canEdit && onEdit && (
          <button
            onClick={handleEdit}
            className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-cream text-tok-teal shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:bg-tok-cream/90 active:translate-y-0 active:shadow-none"
            title="Edit Drop"
          >
            <Edit3 size={18} strokeWidth={3} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-red-500 shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:bg-red-50 active:translate-y-0 active:shadow-none"
            title="Delete Drop"
          >
            <Trash2 size={18} strokeWidth={3} />
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
}: {
  drop: DropCardModel;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  onEdit?: (drop: Drop) => void;
  onDelete?: (drop: Drop) => void;
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
            <img
              src={drop.coverPhoto}
              alt={drop.name}
              className="absolute inset-0 h-full w-full object-cover"
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
              Live
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-passion text-[9px] font-bold uppercase tracking-[1px] text-tok-black/40">
              {role}
            </span>
            {drop.category && (
              <span className="rounded-sm bg-tok-teal-pale px-1.5 py-0.5 font-passion text-[8px] font-bold uppercase tracking-wider text-tok-teal border border-tok-teal/20">
                {drop.category}
              </span>
            )}
            {!drop.isPublic && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-tok-black/5 px-1.5 py-0.5 font-passion text-[8px] font-bold uppercase tracking-wider text-tok-black/40">
                <Lock size={8} strokeWidth={3} />
                Private
              </span>
            )}
          </div>

          <h3 className="font-passion text-xl font-bold leading-tight text-tok-black group-hover:text-tok-teal transition-colors pr-10 sm:pr-0 mb-2">
            {drop.name}
          </h3>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-tok-black/40 mb-3">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} className="text-tok-teal" strokeWidth={2.5} />
              <span className="font-passion uppercase tracking-wider">{formatDateTime(drop.scheduledAt)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-tok-teal" strokeWidth={2.5} />
              <span className="font-passion truncate uppercase tracking-wider max-w-[150px]">{drop.location}</span>
            </span>
          </div>

          {drop.overview && (
            <p className="font-inter text-[11px] leading-relaxed text-tok-black/60 line-clamp-2 mb-4">
              {drop.overview}
            </p>
          )}

          {/* Crew Section */}
          <div className="mt-auto flex items-center gap-2">
            <div className="flex items-center">
              {crew && crew.length > 0 ? (
                <>
                  {crew.slice(0, 3).map((member, i) => (
                    <div
                      key={member.id}
                      className={cn(
                        "relative h-6 w-6 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden",
                        i > 0 && "-ml-3"
                      )}
                      title={`${member.user.firstName} ${member.user.lastName}`}
                    >
                      {member.user.avatar ? (
                        <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-passion text-[8px] text-tok-teal">
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </div>
                      )}
                    </div>
                  ))}
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
                  <img src={drop.organiser.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-passion text-[8px] text-tok-teal">
                    {drop.organiser?.firstName?.[0] || '?'}{drop.organiser?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <p className="font-passion text-[9px] font-bold uppercase tracking-wider text-tok-black/60">
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
    </div>
  );
}

export function HeroCardSkeleton() {

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black/10 bg-tok-teal/5 md:flex-row">
      <Skeleton className="aspect-video w-full shrink-0 border-b-[3px] border-tok-black/5 md:aspect-square md:w-[280px] md:border-b-0 md:border-r-[3px]" />
      <div className="flex-1 p-5 space-y-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-sm bg-tok-black/10" />
          <Skeleton className="h-10 w-3/4 max-w-[300px] rounded-sm bg-tok-black/5" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-full rounded-sm bg-tok-black/5" />
          <Skeleton className="h-2.5 w-2/3 rounded-sm bg-tok-black/5" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full border-2 border-tok-black/5 bg-tok-black/5" />
            <Skeleton className="-ml-4 h-8 w-8 rounded-full border-2 border-tok-black/5 bg-tok-black/5" />
            <Skeleton className="-ml-4 h-8 w-8 rounded-full border-2 border-tok-black/5 bg-tok-black/5" />
          </div>
          <Skeleton className="h-3 w-24 rounded-sm bg-tok-black/10" />
        </div>



        <div className="pt-4 grid grid-cols-1 gap-3 border-t border-dashed border-tok-black/5 sm:grid-cols-2">
          <Skeleton className="h-8 w-full rounded-sm bg-tok-black/5" />
          <Skeleton className="h-8 w-full rounded-sm bg-tok-black/5" />
        </div>
        <Skeleton className="h-10 w-40 rounded-sm bg-tok-black/5 border-2 border-tok-black/5" />
      </div>
    </div>
  );
}

export function ListCardSkeleton() {

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black/10 bg-white/40 mt-4 sm:flex-row">
      <Skeleton className="aspect-video w-full shrink-0 border-b-[3px] border-tok-black/5 sm:aspect-square sm:w-32 sm:border-b-0 sm:border-r-[3px]" />
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-12 rounded-sm bg-tok-black/10" />
          <Skeleton className="h-2.5 w-16 rounded-sm bg-tok-black/10 opacity-50" />
        </div>
        <Skeleton className="h-6 w-3/4 max-w-[240px] rounded-sm bg-tok-black/5" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20 rounded-sm bg-tok-black/10 opacity-50" />
          <Skeleton className="h-3 w-20 rounded-sm bg-tok-black/10 opacity-50" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-full rounded-sm bg-tok-black/5" />
          <Skeleton className="h-2.5 w-4/5 rounded-sm bg-tok-black/5" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center">
            <Skeleton className="h-6 w-6 rounded-full border-2 border-tok-black/5 bg-tok-black/5" />
            <Skeleton className="-ml-3 h-6 w-6 rounded-full border-2 border-tok-black/5 bg-tok-black/5" />
          </div>
          <Skeleton className="h-2.5 w-16 rounded-sm bg-tok-black/10 opacity-50" />
        </div>



      </div>
    </div>
  );
}


