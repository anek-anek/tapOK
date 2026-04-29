'use client';

import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { useMyDrops } from '@/hooks/queries/use-drops';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import type { Drop, DropActivityLog } from '@/types/drop';

interface DropPreview {
  id: string;
  name: string;
  status: 'active' | 'ongoing';
  scheduledAt: string;
  location: string;
}

interface FrequentPerson {
  userId: string;
  firstName: string;
  lastName: string;
  initials: string;
  count: number;
  lastSeen: string;
}

const AVATAR_COLORS = [
  'bg-tok-teal text-[#F7E9B2]',
  'bg-tok-teal/12 text-tok-teal',
  'bg-[#2a2118]/10 text-[#2a2118]/56',
  'bg-[#2a2118] text-[#F7E9B2]',
] as const;

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]!;
}

function getFrequentlySeen(logs: DropActivityLog[], currentUserId: string): FrequentPerson[] {
  const counts = new Map<string, FrequentPerson>();

  for (const log of logs) {
    if (log.userId === currentUserId) continue;
    const existing = counts.get(log.userId);
    if (existing) {
      existing.count += 1;
      if (log.createdAt > existing.lastSeen) existing.lastSeen = log.createdAt;
    } else {
      counts.set(log.userId, {
        userId: log.userId,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        initials: `${log.user.firstName[0] ?? ''}${log.user.lastName[0] ?? ''}`.toUpperCase(),
        count: 1,
        lastSeen: log.createdAt,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 5);
}

function lastSeenSub(person: FrequentPerson): string {
  const diffDays = Math.round((Date.now() - new Date(person.lastSeen).getTime()) / 86_400_000);
  if (diffDays < 1) return 'Seen today';
  if (diffDays === 1) return 'Seen yesterday';
  return `Seen ${diffDays} days ago`;
}

const STATUS_DOT: Record<'active' | 'ongoing', string> = {
  active:  'bg-emerald-500',
  ongoing: 'bg-amber-500 animate-pulse',
};

const STATUS_LABEL: Record<'active' | 'ongoing', string> = {
  active:  'Active',
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
      className="flex items-start gap-3 px-5 py-3.5 border-t border-[#2a2118]/6 hover:bg-[#2a2118]/2 transition-colors"
    >
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[drop.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#2a2118] truncate">
          {drop.name}
        </p>
        <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-[#2a2118]/46">
          <span className="flex items-center gap-1">
            <CalendarDays size={10} className="opacity-60 shrink-0" />
            {formatShortDate(drop.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} className="opacity-60 shrink-0" />
            <span className="truncate">{drop.location}</span>
          </span>
        </div>
      </div>
      <span className="font-passion text-[8px] font-bold uppercase tracking-[1px] text-tok-teal bg-tok-teal/10 border border-tok-teal/15 px-2 py-1 rounded-full shrink-0 mt-1">
        {STATUS_LABEL[drop.status]}
      </span>
    </Link>
  );
}

function DropSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 border-t border-[#2a2118]/6">
      <Skeleton className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[#2a2118]/10" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4 rounded bg-[#2a2118]/10" />
        <Skeleton className="h-2.5 w-1/2 rounded bg-[#2a2118]/[0.07]" />
      </div>
    </div>
  );
}

function PersonSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-[#2a2118]/6">
      <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-[#2a2118]/10" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24 rounded bg-[#2a2118]/10" />
        <Skeleton className="h-2.5 w-16 rounded-full bg-[#2a2118]/[0.07]" />
      </div>
      <Skeleton className="h-5 w-5 rounded bg-[#2a2118]/8" />
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
  const { data: apiDrops, isLoading: dropsLoading } = useMyDrops();

  const activeDrops: DropPreview[] = (
    apiDrops?.filter((d) => d.status === 'active' || d.status === 'ongoing') ?? []
  ).map((d: Drop) => ({
    id: d.id,
    name: d.name,
    status: d.status as 'active' | 'ongoing',
    scheduledAt: d.scheduledAt,
    location: d.location,
  }));

  const frequentlySeen = currentUserId
    ? getFrequentlySeen(activityLogs, currentUserId)
    : [];

  return (
    <div className="space-y-4">
      {/* Active Drops */}
      <div className="rounded-[22px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
            Active Drops
          </p>
          <Link
            href="/drops"
            className="font-passion text-[10px] font-bold tracking-[1px] text-tok-teal hover:underline"
          >
            See all
          </Link>
        </div>

        {dropsLoading ? (
          <>
            <DropSkeleton />
            <DropSkeleton />
          </>
        ) : activeDrops.length > 0 ? (
          activeDrops.map((drop) => <DropRow key={drop.id} drop={drop} />)
        ) : (
          <p className="px-5 pb-4 text-[12px] text-[#2a2118]/40">
            No active drops right now.
          </p>
        )}
      </div>

      {/* Frequently Seen */}
      <div className="rounded-[22px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.05)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
            Frequently Seen
          </p>
        </div>

        {activityLoading ? (
          <>
            <PersonSkeleton />
            <PersonSkeleton />
            <PersonSkeleton />
          </>
        ) : frequentlySeen.length > 0 ? (
          frequentlySeen.map((person, i) => (
            <div
              key={person.userId}
              className="flex items-center gap-3 px-5 py-3 border-t border-[#2a2118]/6"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-passion text-[10px] font-extrabold shrink-0 ${avatarColor(i)}`}
              >
                {person.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#2a2118]">
                  {person.firstName} {person.lastName}
                </p>
                <p className="text-[11px] text-[#2a2118]/46 mt-0.5">{lastSeenSub(person)}</p>
              </div>
              <span className="font-passion text-[20px] font-bold text-tok-teal leading-none">
                {person.count}
              </span>
            </div>
          ))
        ) : (
          <p className="px-5 pb-4 text-[12px] text-[#2a2118]/40">
            No one else has joined your drops yet.
          </p>
        )}
      </div>
    </div>
  );
}
