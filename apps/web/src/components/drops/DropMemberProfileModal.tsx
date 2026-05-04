'use client';

import React, { useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X as IconX, UserCheck as IconUserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrewMember, DropOrganiser } from '@/types/drop';

/** Chief (drop host) vs crew roster row — roster or sidebar entry point. */
export type DropMemberProfileSubject =
  | { kind: 'organiser'; profile: DropOrganiser }
  | { kind: 'crew'; member: CrewMember };

export interface DropMemberProfileModalProps {
  subject: DropMemberProfileSubject;
  onClose: () => void;
}

function headerTitle(kind: 'organiser' | 'crew'): string {
  return kind === 'organiser' ? 'Chief profile' : 'Crew profile';
}

/**
 * Some auth providers return thumbnail avatar URLs by default (e.g. 48-96px).
 * Normalize known patterns to request larger source images for the profile card.
 */
function getHighResAvatarUrl(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined;

  let upgraded = avatarUrl;

  // Google profile photos: ...=s96-c -> ...=s512-c
  upgraded = upgraded.replace(/=s\d+-c$/i, '=s512-c');
  upgraded = upgraded.replace(/=s\d+$/i, '=s512');

  // GitHub avatars: ...?s=96 -> ...?s=512
  upgraded = upgraded.replace(/([?&]s=)\d+/i, '$1512');

  // Twitter/X avatars: ..._normal.jpg -> ..._400x400.jpg
  upgraded = upgraded.replace(/_normal(\.\w+)(\?.*)?$/i, '_400x400$1$2');

  return upgraded;
}

export function DropMemberProfileModal({ subject, onClose }: DropMemberProfileModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const memberSince = useMemo(() => {
    const src = subject.kind === 'organiser' ? subject.profile.createdAt : undefined;
    if (!src) return 'NOT DISCLOSED';
    try {
      const d = new Date(src);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch {
      return 'UNKNOWN';
    }
  }, [subject]);

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return 'NOT DISCLOSED';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    } catch {
      return 'NOT DISCLOSED';
    }
  };

  /** Short month + day for prominent display (crew drop intel column). */
  const formatJoinedDropHeadline = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()),
      };
    } catch {
      return { mo: '—', day: '—' };
    }
  };

  const displayName =
    subject.kind === 'organiser'
      ? { first: subject.profile.firstName, last: subject.profile.lastName, avatar: subject.profile.avatar }
      : {
          first: subject.member.user.firstName,
          last: subject.member.user.lastName,
          avatar: subject.member.user.avatar,
        };

  const profileAvatarSrc = useMemo(() => getHighResAvatarUrl(displayName.avatar), [displayName.avatar]);

  const crewRoleSubtitle =
    subject.kind === 'crew'
      ? subject.member.memberRole === 'chief' || subject.member.memberRole === 'co_chief'
        ? 'Drop chief · This drop'
        : 'Crew · This drop'
      : null;

  const crewRoleBadge =
    subject.kind === 'crew'
      ? subject.member.memberRole === 'chief'
        ? 'CHIEF'
        : subject.member.memberRole === 'co_chief'
          ? 'CO-CHIEF'
          : 'CREW'
      : null;

  const crewJoinedHead =
    subject.kind === 'crew' ? formatJoinedDropHeadline(subject.member.joinedAt) : null;

  const organiserHandle =
    subject.kind === 'organiser' ? subject.profile.userHandle?.trim() ?? '' : '';

  const profileCards = useMemo(() => {
    if (subject.kind === 'organiser') {
      return {
        intelLeftValue: String(subject.profile.dropCount ?? 0),
        intelLeftLabel: 'Drops hosted',
        intelRightValue: String(subject.profile.crewReached ?? 0),
        intelRightLabel: 'Crews reached',
        activeSince: memberSince,
        gender: (subject.profile.gender ?? 'NOT SET').toUpperCase(),
        birthday: formatDate(subject.profile.birthday),
      };
    }

    // Keep the same card schema for crew, using available crew data + safe placeholders.
    const joined = crewJoinedHead ? `${crewJoinedHead.mo} ${crewJoinedHead.day}` : '—';
    return {
      intelLeftValue: joined,
      intelLeftLabel: 'Joined this drop',
      intelRightValue: subject.member.isPresent ? 'IN' : 'OUT',
      intelRightLabel: 'Attendance',
      activeSince: formatDate(subject.member.joinedAt),
      gender: 'NOT SET',
      birthday: 'NOT DISCLOSED',
    };
  }, [subject, memberSince, crewJoinedHead]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex min-h-0 flex-col justify-end sm:justify-center sm:p-4',
        'supports-[padding:max(0px)]:pt-[max(0.5rem,env(safe-area-inset-top))]',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drop-member-profile-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute inset-0 bg-tok-black/40 backdrop-blur-sm',
          'supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]',
          'sm:pt-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 28 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={cn(
          'relative z-10 mx-auto flex max-h-[100dvh] w-full max-w-none min-w-0 flex-col overflow-hidden',
          'border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]',
          'rounded-t-xl border-b-0 pb-[env(safe-area-inset-bottom,0)]',
          'sm:max-h-[min(92vh,840px)] sm:w-full sm:max-w-[min(100vw-2rem,28rem)] sm:rounded-[4px] sm:border-b-[3px] sm:pb-0',
          'sm:rounded-b-[4px]',
          'md:max-w-xl lg:shadow-[14px_14px_0px_#1C1C1A]',
          'motion-reduce:transition-none',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-[3px] border-tok-black bg-tok-teal px-4 py-3 sm:h-auto sm:min-h-[3.35rem] sm:px-5 md:px-6 md:py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-[2px_2px_0px_#1C1C1A] md:h-3 md:w-3" aria-hidden />
            <p
              id="drop-member-profile-title"
              className="min-w-0 truncate font-passion text-xs font-bold uppercase tracking-[2px] text-white sm:text-sm md:text-[0.9375rem] md:tracking-[2.5px]"
            >
              {headerTitle(subject.kind)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black md:h-9 md:w-9',
              'touch-manipulation outline-none transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none',
              'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tok-teal',
            )}
          >
            <IconX size={18} strokeWidth={3} aria-hidden />
            <span className="sr-only">Close profile</span>
          </button>
        </div>

        {/* Body — min-h-0 allows inner scroll */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
              'px-4 pb-6 pt-5 md:px-8 md:pb-8 md:pt-8',
              'supports-[padding:max(0px)]:scroll-pb-[max(1.5rem,env(safe-area-inset-bottom))]',
            )}
          >
            {/* Hero: stack on phones, horizontal from sm when space */}
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6 md:gap-8">
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'relative mx-auto overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-teal-pale shadow-[6px_6px_0px_#1C1C1A] sm:border-[4px] md:shadow-[8px_8px_0px_#1C1C1A]',
                    'h-[8.625rem] w-[8.625rem] max-[320px]:h-[7.75rem] max-[320px]:w-[7.75rem] sm:mx-0 sm:h-[9.875rem] sm:w-[9.875rem]',
                    'md:h-44 md:w-44 lg:h-[11.125rem] lg:w-[11.125rem]',
                  )}
                >
                  {profileAvatarSrc ? (
                    <Image
                      src={profileAvatarSrc}
                      alt=""
                      fill
                      quality={95}
                      sizes="(max-width: 639px) 160px, (max-width: 1023px) 176px, 192px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-passion text-[clamp(2.25rem,9vw,3.375rem)] text-tok-teal uppercase leading-none md:text-5xl lg:text-[3.375rem]">
                      {displayName.first?.[0]}
                      {displayName.last?.[0]}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    'pointer-events-none absolute rounded-full border-[3px] border-tok-black bg-amber-400 shadow-[3px_3px_0px_#1C1C1A]',
                    '-right-1 -top-1 flex h-[2rem] w-[2rem] items-center justify-center p-1 md:-right-2.5 md:-top-2.5 md:h-10 md:w-10 md:p-1.5 md:[&_svg]:h-5 md:[&_svg]:w-5',
                  )}
                  aria-hidden
                >
                  <IconUserCheck className="size-[1.0625rem] text-tok-black md:size-[1.25rem]" strokeWidth={3} />
                </span>
              </div>

              <div className="w-full min-w-0 flex-1 text-center sm:grow sm:pt-0 sm:text-left lg:pt-1">
                <h3 className="break-words px-1 font-passion text-[clamp(1.4375rem,5.5vw,2.125rem)] font-bold uppercase leading-[1.1] tracking-tight text-tok-black md:px-0">
                  {displayName.first} {displayName.last}
                </h3>
                {subject.kind === 'organiser' ? (
                  <>
                    <p className="mt-1 font-passion text-xs font-bold uppercase tracking-[1.5px] text-tok-black/65 md:mt-1.5 md:text-sm md:tracking-[1.75px]">
                      Drop chief
                    </p>
                    {organiserHandle ? (
                      <p className="mt-1 max-w-[20rem] mx-auto break-all font-passion text-base font-bold uppercase tracking-[1.8px] text-tok-teal sm:mx-0 sm:text-lg md:text-xl md:tracking-[2px]">
                        @{organiserHandle}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 font-passion text-xs font-bold uppercase tracking-[1.4px] text-tok-black/65 md:mt-1.5 md:text-sm md:tracking-[1.75px]">
                    {crewRoleSubtitle}
                  </p>
                )}
              </div>
            </div>

            <section className={cn('mt-2 flex flex-col gap-3 md:mt-10 md:gap-4')} aria-live="polite">
              <div className="rounded-sm border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A] sm:p-[1.15rem] md:p-6">
                <p className="font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black/45">
                  Drop intel
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-8 lg:gap-x-10">
                  <div className="min-w-0 border-r-2 border-tok-black/10 pr-3 sm:pr-6">
                    <p className="font-passion text-[clamp(1.5rem,6.5vw,2.375rem)] font-bold leading-none text-tok-teal md:text-[2.5rem]">
                      {profileCards.intelLeftValue}
                    </p>
                    <p className="mt-1 font-passion text-[10px] font-bold uppercase leading-tight tracking-[1px] text-tok-black/70 sm:text-[11px] sm:tracking-[1.25px]">
                      {profileCards.intelLeftLabel}
                    </p>
                  </div>
                  <div className="min-w-0 pl-1 sm:pl-2 lg:pl-4">
                    <p className="font-passion text-[clamp(1.5rem,6.5vw,2.375rem)] font-bold leading-none text-tok-black md:text-[2.5rem]">
                      {profileCards.intelRightValue}
                    </p>
                    <p className="mt-1 font-passion text-[10px] font-bold uppercase leading-snug tracking-[1px] text-tok-black/70 sm:text-[11px] sm:tracking-[1.25px]">
                      {profileCards.intelRightLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 rounded-sm border-2 border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] flex flex-wrap items-center justify-between gap-x-6">
                <span className="font-passion text-[10px] font-bold uppercase tracking-[1.25px] text-tok-black/60 shrink-0 md:text-[11px] md:tracking-[1.5px]">
                  Active since
                </span>
                <span className="break-words font-passion text-xs font-bold uppercase leading-snug tracking-[0.8px] text-tok-black text-right sm:text-sm sm:max-w-[18rem] md:max-w-[24rem] md:text-base lg:text-[0.95rem]">
                  {profileCards.activeSince}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="px-4 flex min-h-[4rem] flex-col justify-center rounded-sm border-2 border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] lg:leading-normal">
                  <p className="font-passion text-[10px] font-bold uppercase tracking-[1.25px] text-tok-black/60 lg:text-[11px]">Gender</p>
                  <p className="mt-1 font-passion text-xs font-bold uppercase tracking-[0.8px] text-tok-black lg:text-[0.95rem]">
                    {profileCards.gender}
                  </p>
                </div>
                <div className="px-4 flex min-h-[4rem] flex-col justify-center rounded-sm border-2 border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A]">
                  <p className="font-passion text-[10px] font-bold uppercase tracking-[1.25px] text-tok-black/60 lg:text-[11px]">Birthday</p>
                  <p className="mt-1 break-words font-passion text-xs font-bold uppercase tracking-[0.8px] text-tok-black lg:text-[0.95rem]">
                    {profileCards.birthday}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex min-h-[2.625rem] shrink-0 items-center justify-center border-t-[3px] border-tok-black bg-tok-black/5 px-3 py-2.5 max-[374px]:py-2 md:px-4 lg:py-3.5">
          <p className="max-w-xl text-center font-passion text-[9px] font-bold uppercase leading-snug tracking-[1.5px] text-tok-black/45 sm:text-[10px] md:text-[11px] md:tracking-[2.5px] xl:tracking-[3px]">
            Credentials · Tap outside · Esc closes
          </p>
        </div>
      </motion.div>
    </div>
  );
}
