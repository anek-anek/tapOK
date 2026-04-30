'use client';

import { useFrequentCrew } from '@/hooks/queries/use-users';
import { Skeleton } from '@/components/ui/skeleton';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

export function FrequentCrewList() {
  const { data: crew, isLoading } = useFrequentCrew();

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-40 rounded-none bg-tok-black/5" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-none border-2 border-tok-black bg-tok-white shadow-[4px_4px_0px_0px_#262624]" />
          <Skeleton className="h-24 w-full rounded-none border-2 border-tok-black bg-tok-white shadow-[4px_4px_0px_0px_#262624]" />
        </div>
      </div>
    );
  }

  if (!crew || crew.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-6 font-passion text-3xl uppercase tracking-tight text-tok-black">
        Frequently Seen Crew
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {crew.map((member) => (
          <div
            key={member.id}
            className="relative border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border-2 border-tok-black bg-tok-teal-pale font-passion text-xl font-bold text-tok-teal shadow-[2px_2px_0px_0px_#262624]">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.firstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(member.firstName, member.lastName)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-passion text-lg leading-none text-tok-black uppercase">
                  {member.firstName} {member.lastName}
                </p>
                {member.userHandle && (
                  <p className="mt-1 font-inter text-xs font-bold text-tok-black/40">@{member.userHandle}</p>
                )}
              </div>
              <div className="text-right">
                <div className="border-2 border-tok-black bg-tok-cream px-2 py-1">
                  <span className="font-passion text-sm text-tok-black">
                    {member.frequencyCount}X
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
