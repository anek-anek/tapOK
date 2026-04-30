'use client';

import Link from 'next/link';
import { CalendarDays, MapPin, TrendingUp, Users, Activity as ActivityIcon } from 'lucide-react';
import { useMyDrops } from '@/hooks/queries/use-drops';
import { useFrequentCrew } from '@/hooks/queries/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import type { Drop, DropActivityLog } from '@/types/drop';
import { cn } from '@/lib/utils';

interface DropPreview {
  id: string;
  name: string;
  status: 'active' | 'ongoing';
  scheduledAt: string;
  location: string;
}

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';
}

const STATUS_DOT: Record<'active' | 'ongoing', string> = {
  active: 'bg-emerald-500',
  ongoing: 'bg-amber-500 animate-pulse',
};

const STATUS_LABEL: Record<'active' | 'ongoing', string> = {
  active: 'Active',
  ongoing: 'Ongoing',
};

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function DropRow({ drop }: { drop: DropPreview }) {
  return (
    <Link
      href={`/drops/${drop.id}`}
      className="group flex items-start gap-3 px-5 py-4 border-b-2 border-tok-black/5 last:border-b-0 hover:bg-tok-teal/3 transition-colors"
    >
      <div className={cn(
        "mt-1 h-3 w-3 rounded-full shrink-0 border-2 border-tok-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
        STATUS_DOT[drop.status]
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-tok-black group-hover:text-tok-teal transition-colors truncate">
          {drop.name}
        </p>
        <div className="mt-1.5 flex flex-col gap-1 text-[11px] font-medium text-tok-black/50">
          <span className="flex items-center gap-2">
            <CalendarDays size={12} className="shrink-0 text-tok-black/30" />
            {formatShortDate(drop.scheduledAt)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={12} className="shrink-0 text-tok-black/30" />
            <span className="truncate">{drop.location}</span>
          </span>
        </div>
      </div>
      <span className="font-passion text-[9px] font-black uppercase tracking-widest text-tok-teal bg-tok-teal/5 border-2 border-tok-teal/20 px-2 py-1 rounded-sm shrink-0 mt-0.5 group-hover:border-tok-black group-hover:bg-tok-teal group-hover:text-tok-cream transition-all">
        {STATUS_LABEL[drop.status]}
      </span>
    </Link>
  );
}

function DropSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="mt-1 h-3 w-3 rounded-full shrink-0 bg-tok-black/5 border-2 border-tok-black/5" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-sm bg-tok-black/5" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-1/2 rounded-sm bg-tok-black/3" />
          <Skeleton className="h-3 w-1/3 rounded-sm bg-tok-black/3" />
        </div>
      </div>
      <Skeleton className="h-4 w-12 rounded-sm bg-tok-black/5 shrink-0 mt-0.5" />
    </div>
  );
}

function PersonSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0 bg-tok-black/5 border-2 border-tok-black/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-24 rounded-sm bg-tok-black/5" />
        <Skeleton className="h-3 w-16 rounded-sm bg-tok-black/3" />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Skeleton className="h-7 w-6 rounded-sm bg-tok-black/5" />
        <Skeleton className="h-2 w-8 rounded-sm bg-tok-black/3" />
      </div>
    </div>
  );
}

export function ActivePanel({
  activityLogs,
  activityLoading,
  currentUserId,
}: {
  activityLogs: DropActivityLog[];
  activityLoading: boolean;
  currentUserId?: string;
}) {
  const { data: apiDrops, isLoading: dropsLoading, isFetched: dropsFetched } = useMyDrops();

  const activeDrops: DropPreview[] = (
    apiDrops?.filter((d) => d.status === 'active' || d.status === 'ongoing') ?? []
  ).map((d: Drop) => ({
    id: d.id,
    name: d.name,
    status: d.status as 'active' | 'ongoing',
    scheduledAt: d.scheduledAt,
    location: d.location,
  })).slice(0, 2);

  const { data: frequentlySeen = [], isLoading: crewLoading } = useFrequentCrew();

  const showDropsSkeleton = !dropsFetched || (dropsLoading && activeDrops.length === 0);

  return (
    <div className="space-y-10">
      {/* Active Drops */}
      <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 bg-tok-teal/3 border-b-2 border-tok-black/80">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-tok-teal" />
            <p className="font-passion text-[12px] font-black uppercase tracking-widest text-tok-black">
              Active Drops
            </p>
          </div>
          <Link
            href="/drops"
            className="font-passion text-[12px] font-black uppercase tracking-wider text-tok-teal hover:underline underline-offset-4"
          >
            See all
          </Link>
        </div>

        <div className="divide-y-2 divide-tok-black/5">
          {showDropsSkeleton ? (
            <>
              <DropSkeleton />
              <DropSkeleton />
            </>
          ) : activeDrops.length > 0 ? (
            activeDrops.map((drop) => <DropRow key={drop.id} drop={drop} />)
          ) : (
            <div className="px-5 py-8 text-center bg-tok-black/1">
              <p className="text-[13px] font-medium text-tok-black/40">
                No active drops right now.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_#262624] rounded-xl overflow-hidden mt-4">
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 bg-tok-black/90 border-b-2 border-tok-black/80">
          <Users size={14} className="text-tok-teal" />
          <p className="font-passion text-[12px] font-black uppercase tracking-widest text-tok-cream">
            Top Crew
          </p>
        </div>

        <div className="divide-y-2 divide-tok-black/5">
          {crewLoading ? (
            <>
              <PersonSkeleton />
              <PersonSkeleton />
              <PersonSkeleton />
            </>
          ) : frequentlySeen.length > 0 ? (
            frequentlySeen.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-tok-teal/5 transition-all group"
              >
                <div className="relative">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border-2 border-tok-black bg-tok-teal-pale font-passion text-xs font-bold text-tok-teal shadow-[2px_2px_0px_0px_#262624] transition-transform group-hover:-translate-y-0.5">
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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-passion text-[15px] leading-none text-tok-black uppercase">
                    {member.firstName} {member.lastName}
                  </p>
                  {member.userHandle && (
                    <p className="mt-1 font-inter text-[10px] font-bold text-tok-black/30">@{member.userHandle}</p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-passion text-[20px] font-black text-tok-teal leading-none">
                    {member.frequencyCount}
                  </span>
                  <span className="font-passion text-[7px] font-black uppercase tracking-tighter text-tok-black/20">
                    X
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center bg-tok-black/1">
              <p className="text-[13px] font-medium text-tok-black/40 italic">
                No squad activity yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
