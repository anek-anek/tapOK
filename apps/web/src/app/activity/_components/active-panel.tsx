'use client';

import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { useMyDrops } from '@/hooks/queries/use-drops';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import type { Drop } from '@/types/drop';

interface DropPreview {
  id: string;
  name: string;
  status: 'active' | 'ongoing';
  scheduledAt: string;
  location: string;
}

const dummyDropPreviews: DropPreview[] = [
  {
    id: 'ramen-run',
    name: 'Ramen Run',
    status: 'active',
    scheduledAt: new Date(Date.now() + 7_200_000).toISOString(),
    location: 'Ramen Nagi, BGC',
  },
  {
    id: 'roof-drinks',
    name: 'Roof Drinks',
    status: 'ongoing',
    scheduledAt: new Date(Date.now() + 18_000_000).toISOString(),
    location: 'The Ruins Rooftop',
  },
];

const frequentlySeen: {
  initials: string;
  color: string;
  name: string;
  sub: string;
  count: number;
}[] = [
  { initials: 'MC', color: 'bg-[#006666] text-[#F7E9B2]',       name: 'Marco',  sub: 'Always shows up',    count: 6 },
  { initials: 'DA', color: 'bg-[#006666]/12 text-[#006666]',     name: 'Dani',   sub: 'Reliable crew',      count: 5 },
  { initials: 'BI', color: 'bg-[#2a2118]/10 text-[#2a2118]/56',  name: 'Bianca', sub: 'Often In',           count: 4 },
  { initials: 'RE', color: 'bg-[#006666]/12 text-[#006666]',     name: 'Rey',    sub: 'Usually makes it',   count: 3 },
];

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
      className="flex items-start gap-3 px-5 py-3.5 border-t border-[#2a2118]/[0.06] hover:bg-[#2a2118]/[0.02] transition-colors"
    >
      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[drop.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#2a2118] truncate">
          {drop.name}
        </p>
        <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-[#2a2118]/46">
          <span className="flex items-center gap-1">
            <CalendarDays size={10} className="opacity-60 flex-shrink-0" />
            {formatShortDate(drop.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} className="opacity-60 flex-shrink-0" />
            <span className="truncate">{drop.location}</span>
          </span>
        </div>
      </div>
      <span className="font-syne text-[8px] font-bold uppercase tracking-[1px] text-[#006666] bg-[#006666]/10 border border-[#006666]/15 px-2 py-1 rounded-full flex-shrink-0 mt-1">
        {STATUS_LABEL[drop.status]}
      </span>
    </Link>
  );
}

function DropSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 border-t border-[#2a2118]/[0.06]">
      <Skeleton className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-[#2a2118]/10" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4 rounded bg-[#2a2118]/10" />
        <Skeleton className="h-2.5 w-1/2 rounded bg-[#2a2118]/[0.07]" />
      </div>
    </div>
  );
}

export function ActivePanel() {
  const { data: apiDrops, isLoading } = useMyDrops();
  const activeApiDrops: DropPreview[] =
    (apiDrops?.filter((d) => d.status === 'active' || d.status === 'ongoing') ?? []).map(
      (d: Drop) => ({
        id: d.id,
        name: d.name,
        status: d.status as 'active' | 'ongoing',
        scheduledAt: d.scheduledAt,
        location: d.location,
      })
    );

  const displayDrops = activeApiDrops.length > 0 ? activeApiDrops : dummyDropPreviews;

  return (
    <div className="space-y-4">
      {/* Active Drops */}
      <div className="rounded-[22px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <p className="font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
            Active Drops
          </p>
          <Link
            href="/drops"
            className="font-syne text-[10px] font-bold tracking-[1px] text-[#006666] hover:underline"
          >
            See all
          </Link>
        </div>

        {isLoading ? (
          <>
            <DropSkeleton />
            <DropSkeleton />
          </>
        ) : (
          displayDrops.map((drop) => <DropRow key={drop.id} drop={drop} />)
        )}
      </div>

      {/* Frequently Seen */}
      <div className="rounded-[22px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.05)] overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
            Frequently Seen
          </p>
        </div>

        {frequentlySeen.map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-3 px-5 py-3 border-t border-[#2a2118]/[0.06] hover:bg-[#2a2118]/[0.02] transition-colors cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-syne text-[10px] font-extrabold flex-shrink-0 ${person.color}`}
            >
              {person.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#2a2118]">{person.name}</p>
              <p className="text-[11px] text-[#2a2118]/46 mt-0.5">{person.sub}</p>
            </div>
            <span className="font-syne text-[20px] font-bold text-[#006666] leading-none">
              {person.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
