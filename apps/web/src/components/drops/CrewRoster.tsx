'use client';

import React from 'react';
import Image from 'next/image';
import { Users as IconUsers, UserX as IconUserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropCrew } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';
import type { CrewMember } from '@/types/drop';

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
      <div className="divide-y-2 divide-tok-black/5">
        {sortedActiveMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-tok-teal/2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal font-passion text-sm font-bold text-tok-cream">
              {member.user.avatar ? (
                <Image src={member.user.avatar} alt="" width={48} height={48} className="h-full w-full object-cover" />
              ) : (
                getLogInitials(member.user.firstName, member.user.lastName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-passion text-lg font-bold uppercase tracking-tight text-tok-black sm:text-xl">
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
            <div className="flex items-center gap-6">
              <span className={cn(
                "rounded-full px-4 py-1.5 font-passion text-[11px] font-bold uppercase tracking-[1.5px] border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A]",
                member.isPresent ? "bg-emerald-500 text-white" : "bg-white text-red-500"
              )}>
                {member.isPresent ? 'TAPPED IN' : 'TAPPED OUT'}
              </span>
              {!isCompleted && isOrganiser && member.userId !== organiserId && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.userId, `${member.user.firstName} ${member.user.lastName}`)}
                  disabled={isRemoving && removingUserId === member.userId}
                  className="flex h-8 w-8 items-center justify-center text-tok-black/20 transition-colors hover:text-red-500 disabled:opacity-50"
                  title="Remove from crew"
                >
                  <IconUserX size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        ))}
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
