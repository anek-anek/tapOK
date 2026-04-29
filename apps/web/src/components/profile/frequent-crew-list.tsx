'use client';

import Link from 'next/link';
import { useFrequentCrew } from '@/hooks/queries/use-users';
import { Skeleton } from '@/components/ui/skeleton';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

export function FrequentCrewList() {
  const { data: crew, isLoading } = useFrequentCrew();

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl bg-[#2a2118]/8" />
        <Skeleton className="h-16 w-full rounded-2xl bg-[#2a2118]/8" />
      </div>
    );
  }

  if (!crew || crew.length === 0) {
    return null; // Or return a message like "No frequent crew yet."
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-inter text-[10px] tracking-widest text-[#2a2118]/40 uppercase">
        Frequently Seen Crew
      </h2>
      <div className="flex flex-col gap-3">
        {crew.map((member) => (
          <Link
            key={member.id}
            href={`/profile/${member.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC] p-4 transition-colors hover:border-[#2a2118]/30 hover:bg-[#F0E9C8]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/20 bg-[#2a2118] font-inter text-sm font-bold text-[#F0E9C8]">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.firstName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(member.firstName, member.lastName)
              )}
            </div>
            <div className="flex-1">
              <p className="font-inter text-sm font-bold text-[#2a2118] uppercase transition-colors group-hover:text-[#1A5C52]">
                {member.firstName} {member.lastName}
              </p>
              {member.userHandle && (
                <p className="font-inter text-xs text-[#2a2118]/50">@{member.userHandle}</p>
              )}
            </div>
            <div className="text-right">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#1A5C52]/10 px-2.5 font-inter text-xs font-bold text-[#1A5C52]">
                {member.frequencyCount} {member.frequencyCount === 1 ? 'drop' : 'drops'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
