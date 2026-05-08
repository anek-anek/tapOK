'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarDays,
  Lock,
  MapPin,
  Users,
  Share,
} from 'lucide-react';
import { coverPhotoSrcForNextImage } from '@/lib/config';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { CrewMember, Drop, DropCardModel } from '@/types/drop';
import { Skeleton } from '@/components/ui/skeleton';
import { SparkButton } from './spark-button';

export function crewFor(drop: DropCardModel): CrewMember[] | undefined {
  if (!('crew' in drop) || !drop.crew) return undefined;
  return drop.crew.filter((m) => m.status === 'in');
}

function sortCrewByLatestJoin(crew: CrewMember[]): CrewMember[] {
  return [...crew].sort((a, b) => {
    const at = new Date(a.joinedAt).getTime();
    const bt = new Date(b.joinedAt).getTime();
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
  });
}

function crewExcludingChief(crew: CrewMember[] = []): CrewMember[] {
  return crew.filter((m) => m.memberRole !== 'chief' && m.memberRole !== 'co_chief');
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

function AvatarImage({
  src,
  alt = '',
  initials,
  width,
  height,
  className,
}: {
  src?: string | null;
  alt?: string;
  initials: string;
  width: number;
  height: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center font-passion text-tok-teal', className)}>
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('h-full w-full object-cover', className)}
      unoptimized={src.startsWith('/')}
      onError={() => setError(true)}
    />
  );
}

/** Get a theme-appropriate fallback cover from the public folder */
export function getFallbackCover(category?: string | null) {
  if (!category) return null;
  const cat = category.toLowerCase();
  if (cat.includes('party') || cat.includes('club') || cat.includes('event')) return '/tapok-party.png';
  if (cat.includes('hangout') || cat.includes('chill') || cat.includes('mission')) return '/tapok-hangout.png';
  return null;
}

/** Overlapping crew faces only — same stacking as HeroDropCard / list cards (no count copy). */
export function CrewAvatarIconsOnly({
  crew,
  maxDisplayed = 4,
  className,
}: {
  crew: CrewMember[];
  maxDisplayed?: number;
  className?: string;
}) {
  if (!crew.length) return null;

  const visible = crew.slice(0, maxDisplayed);
  const overflow = crew.length - maxDisplayed;

  return (
    <div
      className={cn('flex items-center', className)}
      role="group"
      aria-label={`${crew.length} ${crew.length === 1 ? 'crew' : 'crews'} tapped in`}
    >
      <div className="flex items-center">
        {visible.map((member, i) => {
          const display = getCrewMemberDisplay(member);
          return (
            <div
              key={member.id}
              className={cn(
                'relative h-8 w-8 shrink-0 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden',
                i > 0 && '-ml-4',
              )}
              title={display.fullName}
            >
              <AvatarImage
                src={display.avatar}
                initials={display.initials}
                width={32}
                height={32}
                className="text-[10px]"
              />
            </div>
          );
        })}
        {overflow > 0 ? (
          <div className="relative -ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion text-[10px] font-bold text-tok-black">
            +{overflow}
          </div>
        ) : null}
      </div>
    </div>
  );
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
  const nonChiefCrew = crewExcludingChief(crew ?? []);
  const nonChiefCrewSorted = sortCrewByLatestJoin(nonChiefCrew);
  const nonChiefCrewCount = nonChiefCrewSorted.length;
  const fallbackSrc = getFallbackCover(drop.category);
  const displaySrc = drop.coverPhoto ? coverPhotoSrcForNextImage(drop.coverPhoto) : fallbackSrc;
  const isLocalFallback = !!displaySrc && displaySrc.startsWith('/');

  const [imgError, setImgError] = useState(false);

  // Reset error state if displaySrc changes
  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  return (
    <div className="group relative">
      <div className="flex flex-col overflow-hidden rounded-xl border-[3px] border-tok-black bg-tok-teal shadow-[8px_8px_0px_#1C1C1A] transition-all group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[12px_12px_0px_#1C1C1A] md:flex-row">
        {/* Visual Section */}
        <div className="relative aspect-video w-full shrink-0 border-b-[3px] border-tok-black md:aspect-square md:w-[280px] md:border-b-0 md:border-r-[3px] bg-tok-black/15">
          <AnimatePresence>
            {displaySrc && !imgError ? (
              <motion.div
                key={displaySrc}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative h-full w-full"
              >
                <Image
                  src={displaySrc}
                  alt={drop.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 560px"
                  priority
                  unoptimized={isLocalFallback}
                  onError={() => setImgError(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="initials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex h-full w-full items-center justify-center bg-tok-black/10 font-passion text-5xl font-bold tracking-widest text-tok-cream/10"
              >
                {getInitials(drop.name)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action Buttons Overlay */}
          <div className="absolute right-3 top-3 z-30 flex flex-col gap-2 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <SparkButton drop={drop} variant="hero" />
          </div>

          <div className="absolute left-3 top-3 z-30 flex gap-2 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 sm:hidden">
            {onShare && isShareableDrop(drop) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare(drop as unknown as Drop);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-cream text-tok-teal shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:bg-tok-cream-dim active:translate-y-0 active:shadow-none"
                title="Share Drop"
              >
                <Share size={18} strokeWidth={3} />
              </button>
            )}
          </div>

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
              {drop.isLocked && (
                <span className="rounded-sm bg-tok-black/20 px-1.5 py-0.5 font-passion text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] flex items-center gap-1">
                  <Lock size={10} strokeWidth={3} />
                  Requires Approval
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tok-cream/30 bg-tok-black/20">
                <AvatarImage
                  src={drop.organiser?.avatar}
                  initials={`${drop.organiser?.firstName?.[0] || '?'}${drop.organiser?.lastName?.[0] || ''}`}
                  width={24}
                  height={24}
                  className="text-[9px] text-tok-cream"
                />
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

          {/* Crew Section — hidden when no non-chief crew */}
          {nonChiefCrewCount > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center">
                {nonChiefCrewSorted.slice(0, 3).map((member, i) => {
                  const display = getCrewMemberDisplay(member);
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "relative h-8 w-8 rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden",
                        i > 0 && "-ml-4",
                      )}
                    >
                      <AvatarImage
                        src={display.avatar}
                        initials={display.initials}
                        width={32}
                        height={32}
                        className="text-[10px]"
                      />
                    </div>
                  );
                })}
                {nonChiefCrewCount > 3 && (
                  <div className="relative -ml-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion text-[10px] font-bold text-tok-black">
                    +{nonChiefCrewCount - 3}
                  </div>
                )}
              </div>

              <span className="inline-flex items-center gap-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                <Users size={12} className="text-tok-teal" strokeWidth={2.5} />
                {nonChiefCrewCount} {nonChiefCrewCount === 1 ? 'CREW' : 'CREWS'}
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
    </div>
  );
}

function masonryAspectFromImageDimensions(naturalWidth: number, naturalHeight: number): number {
  if (!naturalWidth || !naturalHeight) return 1;
  const r = naturalWidth / naturalHeight;
  if (r > 1.25) return 1.5;
  if (r < 0.8) return 0.8;
  return 1.0;
}

const MASONRY_PLACEHOLDER_ASPECT = 'aspect-[4/5]';

/** Compact list card for the UPCOMING/PAST tabs */

export function ListDropCard({
  drop,
  viewerId,
  onShare,
  showShareEditDelete = true,
  layout = 'list',
  coverPriority = false,
  showChiefInStack = true,
}: {
  drop: DropCardModel;
  viewerId?: string | null;
  onShare?: (drop: Drop) => void;
  showShareEditDelete?: boolean;
  layout?: 'list' | 'masonry' | 'grid';
  coverPriority?: boolean;
  showChiefInStack?: boolean;
}) {
  const role = getRole(drop, viewerId);
  const crew = crewFor(drop);
  const nonChiefCrew = crewExcludingChief(crew ?? []);
  const nonChiefCrewSorted = sortCrewByLatestJoin(nonChiefCrew);
  const nonChiefCrewCount = nonChiefCrewSorted.length;
  const fallbackSrc = getFallbackCover(drop.category);
  const displaySrc = drop.coverPhoto ? coverPhotoSrcForNextImage(drop.coverPhoto) : fallbackSrc;
  const isLocalFallback = !!displaySrc && displaySrc.startsWith('/');

  const isCompleted = drop.status === 'completed';
  const isMasonry = layout === 'masonry';
  const isGrid = layout === 'grid';
  const isVertical = isMasonry || isGrid;

  const [masonryCoverAspect, setMasonryCoverAspect] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);

  // Reset error state if displaySrc changes
  useEffect(() => {
    setImgError(false);
  }, [displaySrc]);

  // Handle Masonry aspect ratio logic - ONLY update if isMasonry and source exists
  useEffect(() => {
    if (!isMasonry || !drop.coverPhoto) {
      setMasonryCoverAspect(null);
    }
  }, [isMasonry, drop.coverPhoto]);

  return (
    <div className={cn('group relative h-full', isVertical ? 'mt-0' : 'mt-4')}>
      <Link
        href={`/drops/${drop.id}`}
        className={cn(
          'flex h-full overflow-hidden border-[3px] border-tok-black transition-all',
          isVertical
            ? 'flex-col rounded-2xl'
            : 'flex-col rounded-xl sm:flex-row',
          isCompleted
            ? 'bg-tok-black/5 opacity-70 grayscale'
            : isVertical
              ? 'bg-white shadow-[3px_3px_0px_#1C1C1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A]'
              : 'bg-white shadow-[4px_4px_0px_#1C1C1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]',
        )}
      >
        {/* Visual Element */}
        <div
          className={cn(
            'relative w-full shrink-0 border-tok-black bg-tok-black/5',
            isVertical
              ? 'border-b-[3px]'
              : 'aspect-5/2 border-b-[3px] sm:aspect-square sm:w-32 sm:border-b-0 sm:border-r-[3px]',
            isGrid && 'aspect-[3/2]',
            isMasonry && !drop.coverPhoto && MASONRY_PLACEHOLDER_ASPECT,
          )}
          style={
            isMasonry && drop.coverPhoto
              ? { aspectRatio: masonryCoverAspect ?? 1 }
              : undefined
          }
        >
          <AnimatePresence>
            {displaySrc && !imgError ? (
              <motion.div
                key={displaySrc}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative h-full w-full"
              >
                <Image
                  src={displaySrc}
                  alt={drop.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes={
                    isVertical
                      ? '(max-width: 640px) 100vw, 400px'
                      : '(max-width: 640px) 100vw, 256px'
                  }
                  priority={coverPriority}
                  unoptimized={isLocalFallback}
                  onLoad={
                    isMasonry
                      ? (e) =>
                        setMasonryCoverAspect(
                          masonryAspectFromImageDimensions(
                            e.currentTarget.naturalWidth,
                            e.currentTarget.naturalHeight,
                          ),
                        )
                      : undefined
                  }
                  onError={() => setImgError(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="initials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'absolute inset-0 flex h-full w-full items-center justify-center bg-tok-teal/10 font-passion font-bold tracking-widest text-tok-teal/30',
                  isVertical ? 'text-lg' : 'text-2xl',
                )}
              >
                {getInitials(drop.name)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action Overlays - pinned to media corner */}
          <div
            className={cn(
              'absolute z-30 flex flex-col transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5',
              'right-2 top-2 gap-1',
            )}
          >
            <SparkButton drop={drop} className="bg-white" />
          </div>

          {showShareEditDelete && (
            <div
              className={cn(
                'absolute z-30 flex transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 sm:hidden',
                'left-2 top-2 gap-1',
              )}
            >
              {onShare && !isCompleted && isShareableDrop(drop) && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShare(drop as unknown as Drop);
                  }}
                  className={cn(
                    'flex items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0 active:shadow-none',
                    'h-8 w-8',
                  )}
                  title="Share Drop"
                >
                  <Share size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          )}


          {/* Status Badge overlay */}
          {drop.status === 'ongoing' && (
            <div
              className={cn(
                'absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-amber-400 font-passion font-bold uppercase tracking-wider text-tok-black border-2 border-tok-black shadow-[1.5px_1.5px_0px_#1C1C1A]',
                isVertical
                  ? 'px-1 py-0.5 text-[7px]'
                  : 'px-1.5 py-0.5 text-[8px]',
              )}
            >
              <span className="relative flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tok-black opacity-75" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-tok-black" />
              </span>
              Ongoing
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          className={cn('relative flex flex-1 flex-col', isVertical ? 'p-3 sm:p-4' : 'p-5 sm:p-6')}
        >
          <div className={cn('flex flex-wrap items-center gap-1.5 sm:gap-2', isVertical ? 'mb-1.5' : 'mb-2')}>
            {drop.category && (
              <span
                className={cn(
                  'rounded-sm bg-tok-teal-pale font-passion font-bold uppercase tracking-wider text-tok-teal border border-tok-teal/20',
                  isVertical ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]',
                )}
              >
                {drop.category}
              </span>
            )}
            {!drop.isPublic && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-sm bg-tok-black/5 font-passion font-bold uppercase tracking-wider text-tok-black/50',
                  isVertical ? 'px-1.5 py-0.5 text-[8px]' : 'gap-1 px-2 py-0.5 text-[9px]',
                )}
              >
                <Lock size={isVertical ? 9 : 10} strokeWidth={3} />
                Private
              </span>
            )}
            {drop.isLocked && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-sm bg-tok-teal-pale font-passion font-bold uppercase tracking-wider text-tok-teal border border-tok-teal/20',
                  isVertical ? 'px-1.5 py-0.5 text-[8px]' : 'gap-1 px-2 py-0.5 text-[9px]',
                )}
              >
                <Lock size={isVertical ? 9 : 10} strokeWidth={3} />
                Requires Approval
              </span>
            )}
          </div>

          <h3
            className={cn(
              'font-passion font-bold leading-snug text-tok-black transition-colors group-hover:text-tok-teal',
              isVertical ? 'mb-1.5 text-base leading-tight sm:text-lg' : 'mb-2.5 text-2xl sm:text-[26px]',
              showShareEditDelete ? (isVertical ? 'pr-7 sm:pr-8' : 'pr-10 sm:pr-0') : '',
            )}
          >
            {drop.name}
          </h3>

          <div
            className={cn(
              'flex flex-wrap font-bold text-tok-black/55',
              isVertical
                ? 'mb-2 gap-x-2 gap-y-1 text-[10px] sm:text-[11px]'
                : 'mb-3.5 gap-x-4 gap-y-1.5 text-xs sm:text-[13px]',
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-1">
              <CalendarDays
                size={isVertical ? 12 : 14}
                className="shrink-0 text-tok-teal"
                strokeWidth={2.5}
              />
              <span className="font-passion uppercase tracking-[0.06em]">{formatDateTime(drop.scheduledAt)}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={isVertical ? 12 : 14} className="shrink-0 text-tok-teal" strokeWidth={2.5} />
              <span
                className={cn(
                  'font-passion truncate uppercase tracking-[0.06em]',
                  isVertical ? 'max-w-[min(100%,9rem)]' : 'max-w-[180px] sm:max-w-[220px]',
                )}
              >
                {drop.location}
              </span>
            </span>
          </div>

          {drop.overview && (
            <p
              className={cn(
                'font-inter leading-relaxed text-tok-black/72 line-clamp-2',
                isVertical ? 'mb-2 text-xs sm:leading-snug' : 'mb-4 text-sm sm:text-[15px] sm:leading-relaxed',
              )}
            >
              {drop.overview}
            </p>
          )}

          {/* Crew Section */}
          {(() => {
            const isChief = viewerId && drop.organiserId === viewerId;
            const viewerCrewEntry = !isChief && viewerId && crew
              ? crew.find((m) => m.userId === viewerId)
              : null;
            const viewerStatus: 'in' | 'pending' | 'out' =
              isChief ? 'in'
                : viewerCrewEntry?.status === 'in' && viewerCrewEntry.isPresent ? 'in'
                  : viewerCrewEntry?.status === 'in' && !viewerCrewEntry.isPresent ? 'out'
                    : viewerCrewEntry?.status === 'pending' ? 'pending'
                      : 'out';

            // Build avatar stack: viewer leads, then chief (if viewer isn't chief), then remaining crew
            type AvatarSlot = { key: string; src?: string | null; initials: string; title: string };
            const slots: AvatarSlot[] = [];

            if (viewerId) {
              if (isChief && drop.organiser) {
                // Viewer is chief — put them first
                slots.push({
                  key: drop.organiserId,
                  src: drop.organiser.avatar,
                  initials: `${drop.organiser.firstName?.[0] || '?'}${drop.organiser.lastName?.[0] || ''}`.toUpperCase(),
                  title: `${drop.organiser.firstName} ${drop.organiser.lastName}`.trim(),
                });
              } else if (viewerCrewEntry) {
                // Viewer is a crew member — put them first
                const d = getCrewMemberDisplay(viewerCrewEntry);
                slots.push({ key: viewerCrewEntry.id, src: d.avatar, initials: d.initials, title: d.fullName });
              }
            }

            // Add chief if viewer is not the chief and chief should be in stack
            if (showChiefInStack && !isChief && drop.organiser) {
              slots.push({
                key: drop.organiserId,
                src: drop.organiser.avatar,
                initials: `${drop.organiser.firstName?.[0] || '?'}${drop.organiser.lastName?.[0] || ''}`.toUpperCase(),
                title: `${drop.organiser.firstName} ${drop.organiser.lastName}`.trim(),
              });
            }

            // Add remaining non-chief crew (excluding viewer)
            for (const member of nonChiefCrewSorted) {
              if (member.userId === viewerId) continue;
              const d = getCrewMemberDisplay(member);
              slots.push({ key: member.id, src: d.avatar, initials: d.initials, title: d.fullName });
            }

            const visibleSlots = slots.slice(0, 3);
            const overflow = slots.length - 3;

            return (
              <div className={cn('mt-auto flex items-center gap-2')}>
                {/* Viewer status pill */}
                <span
                  className={cn(
                    'shrink-0 rounded-sm border-2 border-tok-black font-passion font-bold uppercase tracking-wider shadow-[1.5px_1.5px_0px_#1C1C1A]',
                    isVertical ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]',
                    viewerStatus === 'in' && 'bg-emerald-400 text-tok-black',
                    viewerStatus === 'pending' && 'bg-amber-300 text-tok-black',
                    viewerStatus === 'out' && 'bg-tok-black/8 text-tok-black/50',
                  )}
                >
                  {viewerStatus === 'in' ? 'Tapped In' : viewerStatus === 'pending' ? 'Pending' : 'Tapped Out'}
                </span>

                {/* Avatar stack: viewer first, then chief, then rest; max 3 visible + overflow */}
                {slots.length > 0 && (
                  <div className="flex items-center">
                    {visibleSlots.map((slot, i) => (
                      <div
                        key={slot.key}
                        className={cn(
                          'relative rounded-full border-2 border-tok-black bg-tok-teal-pale overflow-hidden',
                          isVertical ? 'h-5 w-5' : 'h-6 w-6',
                          i > 0 && (isVertical ? '-ml-2' : '-ml-3'),
                        )}
                        title={slot.title}
                      >
                        <AvatarImage
                          src={slot.src}
                          initials={slot.initials}
                          width={isVertical ? 20 : 24}
                          height={isVertical ? 20 : 24}
                          className={isVertical ? 'text-[7px]' : 'text-[8px]'}
                        />
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div
                        className={cn(
                          'relative flex items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream font-passion font-bold text-tok-black',
                          isVertical ? '-ml-2 h-5 w-5 text-[7px]' : '-ml-3 h-6 w-6 text-[8px]',
                        )}
                      >
                        +{overflow}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Link >


    </div >
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
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-3.5 w-14 rounded-sm bg-tok-cream/25" />
              <Skeleton className="h-5 w-20 rounded-sm border border-amber-400/30 bg-tok-black/25" />
            </div>
            <div className="flex items-center gap-2.5 mb-2">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full border border-tok-cream/30 bg-tok-black/25" />
              <Skeleton className="h-3.5 w-40 rounded-sm bg-tok-cream/30" />
            </div>
            <Skeleton className="h-9 w-3/4 rounded-sm bg-tok-cream/25 mb-4" />
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
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm bg-tok-cream/35" />
              <Skeleton className="h-4 w-32 rounded-sm bg-tok-cream/25" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm bg-tok-cream/35" />
              <Skeleton className="h-4 w-40 rounded-sm bg-tok-cream/25" />
            </div>
          </div>

          <div className="mt-6">
            <Skeleton className="h-10 w-40 rounded-sm border-2 border-tok-black bg-tok-cream/50 shadow-[3px_3px_0px_#1C1C1A]" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-20">
        <Skeleton className="h-11 w-11 rounded-md border-[3px] border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A]" />
      </div>
    </div>
  );
}

export function ListCardSkeleton({ layout = 'list' }: { layout?: 'list' | 'masonry' | 'grid' }) {
  const isVertical = layout === 'masonry' || layout === 'grid';

  return (
    <div className={cn('group relative', isVertical ? 'mt-0' : 'mt-4')}>
      <div
        className={cn(
          'flex overflow-hidden rounded-xl border-[3px] border-tok-black bg-white transition-all',
          isVertical
            ? 'flex-col shadow-[3px_3px_0px_#1C1C1A]'
            : 'flex-col shadow-[4px_4px_0px_#1C1C1A] sm:flex-row',
        )}
      >
        <div
          className={cn(
            'relative shrink-0 border-tok-black',
            isVertical
              ? 'aspect-[4/5] w-full border-b-[3px]'
              : 'aspect-5/2 w-full border-b-[3px] sm:aspect-square sm:w-32 sm:border-b-0 sm:border-r-[3px]',
            layout === 'grid' && 'aspect-[3/2]',
          )}
        >
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-tok-teal/15" />
          <div className="pointer-events-none absolute bottom-2 left-2 sm:bottom-2 sm:left-2">
            <Skeleton className="h-5 w-16 rounded-sm border border-tok-black/30 bg-tok-teal/20" />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className={cn('flex flex-wrap items-center gap-1.5 sm:gap-2', isVertical ? 'mb-1.5' : 'mb-2')}>
            <Skeleton className="h-2.5 w-14 rounded-sm bg-tok-black/15" />
            <Skeleton className="h-5 w-17 rounded-sm bg-tok-teal-pale/80" />
          </div>

          <Skeleton className={cn('mb-2.5 max-w-md rounded-sm bg-tok-black/10', isVertical ? 'h-6 sm:h-7' : 'h-8 sm:h-9')} />

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
