'use client';

import React from 'react';
import Image from 'next/image';
import { Users as IconUsers, UserCheck as IconUserCheck, UserX as IconUserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropCrew } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';
import type { CrewMember } from '@/types/drop';

/** When set, tap in / out for the signed-in crew member is shown inside The Crew card. */
export type CrewRosterMyPresence = {
  isPresent: boolean;
  onTapIn: () => void;
  onTapOut: () => void;
  isPending: boolean;
};

interface CrewRosterProps {
  dropId: string;
  organiserId: string;
  organiser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  dropCreatedAt: string;
  isOrganiser: boolean;
  isCompleted: boolean;
  onRemoveMember: (userId: string, name: string) => void;
  isRemoving: boolean;
  removingUserId: string | null;
  myPresence?: CrewRosterMyPresence;
  onOpenMemberProfile: (member: CrewMember) => void;
}

export function CrewRoster({
  dropId,
  organiserId,
  organiser,
  dropCreatedAt,
  isOrganiser,
  isCompleted,
  onRemoveMember,
  isRemoving,
  removingUserId,
  myPresence,
  onOpenMemberProfile,
}: CrewRosterProps) {
  const { data: members = [], isLoading, isError } = useDropCrew(dropId, { enabled: Boolean(dropId) });

  if (isLoading) return <CrewRosterSkeleton />;
  if (isError) return null;

  const activeMembers = members.filter((m) => m.status === 'in');
  const chiefFromCrew = activeMembers.find((m) => m.userId === organiserId);
  const chiefMember: CrewMember = chiefFromCrew ?? {
    id: `chief-${organiserId}`,
    dropId,
    userId: organiserId,
    memberRole: 'chief',
    status: 'in',
    isPresent: true,
    joinedAt: dropCreatedAt,
    user: {
      id: organiser.id,
      firstName: organiser.firstName,
      lastName: organiser.lastName,
      avatar: organiser.avatar,
    },
  };

  const nonChiefMembers = activeMembers.filter((m) => m.userId !== organiserId);
  const sortedNonChiefMembers = [...nonChiefMembers].sort((a, b) => {
    const aIsChief = a.userId === organiserId ? 1 : 0;
    const bIsChief = b.userId === organiserId ? 1 : 0;
    if (aIsChief !== bIsChief) return bIsChief - aIsChief;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
  const sortedActiveMembers = [chiefMember, ...sortedNonChiefMembers];

  const formatLogTime = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getLogInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-tok-teal/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconUsers size={18} strokeWidth={2.5} className="text-tok-teal" />
            <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
              The Crew
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border-2 border-tok-black bg-emerald-500 px-2.5 py-0.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white">
              {sortedActiveMembers.filter((m) => m.isPresent).length} In
            </span>
            <span className="rounded-sm border-2 border-tok-black bg-red-500 px-2.5 py-0.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white">
              {sortedActiveMembers.filter((m) => !m.isPresent).length} Out
            </span>
          </div>
        </div>
      </div>

      {myPresence && (
        <div
          className="border-t-[3px] border-tok-black bg-tok-cream/25 px-4 py-4 sm:px-6 sm:py-5"
          aria-label="Your attendance at this drop"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 gap-3 sm:items-center sm:gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-teal text-white shadow-[3px_3px_0px_#1C1C1A] sm:flex">
                <IconUserCheck size={20} strokeWidth={2.5} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal sm:text-[11px] sm:tracking-[3px]">
                  Your attendance
                </p>
                <p
                  className="mt-1 font-passion text-xl font-bold uppercase leading-tight tracking-tight text-tok-black sm:text-2xl"
                  aria-live="polite"
                >
                  {myPresence.isPresent ? "YOU'RE IN" : 'NOT IN YET'}
                </p>
                <p className="mt-1 font-inter text-xs leading-snug text-tok-black/50 sm:max-w-md">
                  Tap in on arrival, tap out when you leave.
                </p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-row items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={myPresence.onTapIn}
                disabled={myPresence.isPresent || myPresence.isPending}
                aria-busy={myPresence.isPending && !myPresence.isPresent}
                className={cn(
                  'flex h-11 min-w-0 flex-1 items-center justify-center rounded-[4px] border-[3px] border-tok-black px-3 font-passion text-[11px] font-bold uppercase tracking-[1.5px] transition-all sm:h-12 sm:min-w-[120px] sm:flex-none sm:px-4 sm:text-xs sm:tracking-[2px]',
                  myPresence.isPresent
                    ? 'bg-tok-teal text-white shadow-[3px_3px_0px_#1C1C1A]'
                    : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none',
                  myPresence.isPending && 'opacity-60',
                )}
              >
                {myPresence.isPending && !myPresence.isPresent ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-tok-black/25 border-t-tok-black" />
                ) : (
                  'TAP IN'
                )}
              </button>
              <button
                type="button"
                onClick={myPresence.onTapOut}
                disabled={!myPresence.isPresent || myPresence.isPending}
                aria-busy={myPresence.isPending && myPresence.isPresent}
                className={cn(
                  'flex h-11 min-w-0 flex-1 items-center justify-center rounded-[4px] border-[3px] border-tok-black px-3 font-passion text-[11px] font-bold uppercase tracking-[1.5px] transition-all sm:h-12 sm:min-w-[120px] sm:flex-none sm:px-4 sm:text-xs sm:tracking-[2px]',
                  !myPresence.isPresent
                    ? 'bg-red-500 text-white shadow-[3px_3px_0px_#1C1C1A]'
                    : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none',
                  myPresence.isPending && 'opacity-60',
                )}
              >
                {myPresence.isPending && myPresence.isPresent ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-tok-black/20 border-t-tok-black" />
                ) : (
                  'TAP OUT'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y-2 divide-tok-black/5">
        {sortedActiveMembers.map((member) => {
          const showRemove = !isCompleted && isOrganiser && member.userId !== organiserId;
          return (
            <div
              key={member.id}
              className={cn(
                'flex w-full min-w-0 items-stretch transition-colors duration-150 ease-out',
                'hover:bg-tok-teal/10 focus-within:bg-tok-teal/10',
              )}
            >
              <button
                type="button"
                onClick={() => onOpenMemberProfile(member)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left outline-none transition-[color]',
                  'sm:gap-4 sm:px-6 sm:py-5',
                  'focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-tok-black focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal font-passion text-sm font-bold text-tok-cream">
                  {member.user.avatar ? (
                    <Image src={member.user.avatar} alt="" width={48} height={48} className="h-full w-full object-cover" />
                  ) : (
                    getLogInitials(member.user.firstName, member.user.lastName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-passion text-lg font-bold uppercase tracking-tight text-tok-black sm:text-xl">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    {member.userId === organiserId && (
                      <span className="inline-flex items-center rounded-sm bg-tok-black px-2 py-0.5 font-passion text-[9px] font-bold tracking-[1.5px] text-tok-yellow">
                        CHIEF
                      </span>
                    )}
                  </div>
                  <p className="font-inter text-xs text-tok-black/40">
                    Joined {formatLogTime(member.joinedAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-center font-passion text-[10px] font-bold uppercase tracking-[1px] border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A] min-w-[44px] sm:min-w-[110px] sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-[1.5px]',
                    member.isPresent ? 'bg-emerald-500 text-white' : 'bg-white text-red-500',
                  )}
                >
                  <span className="hidden sm:inline">
                    {member.isPresent ? 'TAPPED IN' : 'TAPPED OUT'}
                  </span>
                  <span className="sm:hidden">{member.isPresent ? 'IN' : 'OUT'}</span>
                </span>
              </button>
              {showRemove ? (
                <div className="flex shrink-0 items-center self-stretch pr-3 sm:pr-4">
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveMember(member.userId, `${member.user.firstName} ${member.user.lastName}`)
                    }
                    disabled={isRemoving && removingUserId === member.userId}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-sm border-2 border-transparent text-tok-black/25',
                      'transition-colors hover:border-tok-black/15 hover:bg-red-50 hover:text-red-500',
                      'disabled:opacity-50',
                      'motion-safe:active:scale-95',
                    )}
                    title="Remove from crew"
                  >
                    <IconUserX size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CrewRosterSkeleton() {
  return (
    <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-tok-teal/5 px-6 py-5">
        <Skeleton className="h-8 w-48 bg-tok-black/5" />
      </div>
      <div className="border-t-[3px] border-tok-black bg-tok-cream/25 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32 rounded-sm bg-tok-teal/25" />
            <Skeleton className="h-7 w-40 max-w-full rounded-sm bg-tok-black/10 sm:h-8 sm:w-48" />
            <Skeleton className="hidden h-3 max-w-md rounded-sm bg-tok-black/8 sm:block" />
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Skeleton className="h-11 flex-1 rounded-[4px] border-[3px] border-tok-black bg-tok-teal/25 sm:min-w-[120px] sm:flex-none" />
            <Skeleton className="h-11 flex-1 rounded-[4px] border-[3px] border-tok-black bg-red-500/25 sm:min-w-[120px] sm:flex-none" />
          </div>
        </div>
      </div>
      <div className="divide-y-2 divide-tok-black/5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <Skeleton className="h-12 w-12 rounded-full bg-tok-black/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32 bg-tok-black/5" />
              <Skeleton className="h-3 w-24 bg-tok-black/10" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full bg-tok-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
