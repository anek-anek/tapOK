'use client';

import React from 'react';
import Image from 'next/image';
import { Activity as IconActivity, ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight } from 'lucide-react';
import { useDropActivityLogs } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityLedgerProps {
  dropId: string;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
}

export function ActivityLedger({ dropId, page, setPage }: ActivityLedgerProps) {
  const { data: activityPage, isLoading, isError } = useDropActivityLogs(dropId, page, {
    enabled: Boolean(dropId),
  });

  const formatLogTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLogInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return <ActivityLedgerSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
        <div className="px-6 py-12 text-center">
          <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-black/30">
            Unable to load drop log
          </p>
          <p className="mt-2 font-inter text-xs text-black/45">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!activityPage || activityPage.data.length === 0) {
    return (
      <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
        <div className="px-6 py-12 text-center">
          <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-black/20">
            Quiet on the deck
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-tok-teal/8 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconActivity size={18} strokeWidth={2.5} className="text-tok-teal" />
            <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
              Drop Log
            </h2>
          </div>
          <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30">
            {activityPage.total} entries
          </span>
        </div>
      </div>

      <div className="divide-y divide-tok-black/5">
        {activityPage.data.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-5 px-4 py-5 transition-colors hover:bg-tok-teal/1 sm:px-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal/10 font-passion text-[10px] font-bold text-tok-teal">
              {log.user.avatar ? (
                <Image src={log.user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                getLogInitials(log.user.firstName, log.user.lastName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-inter text-sm leading-relaxed text-tok-black/80">
                <span className="truncate font-passion text-sm font-bold uppercase tracking-tight text-tok-black sm:text-base">
                  {log.user.firstName} {log.user.lastName}
                </span>
                {' '}
                <span className="font-medium">
                  {{
                    created: 'initiated the drop',
                    joined: 'boarded the crew',
                    join_requested: 'sent a join request',
                    join_request_approved: 'cleared a join request',
                    join_request_rejected: 'denied a join request',
                    left: 'abandoned ship',
                    updated: 'modified the plan',
                    member_removed: 'ejected a crew member',
                    marked_in: 'tapped IN',
                    marked_out: 'tapped OUT',
                    marked_ongoing: 'pushed the drop LIVE',
                    marked_completed: 'closed the mission',
                    photo_added: 'posted a new shot to the roll',
                    photo_removed: 'removed a shot from the roll',
                    photo_featured: 'spotlighted a moment',
                    photo_unfeatured: 'cleared the spotlight',
                  }[log.action] ?? log.action.replace(/_/g, ' ')}
                </span>
              </p>
              <p className="mt-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30">
                {formatLogTime(log.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activityPage.totalPages > 1 && (
        <div className="flex items-center justify-between border-t-[3px] border-tok-black px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="flex items-center gap-1.5 rounded-[4px] border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <IconChevronLeft size={12} strokeWidth={2.5} />
            Prev
          </button>
          <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
            {page} / {activityPage.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === activityPage.totalPages}
            className="flex items-center gap-1.5 rounded-[4px] border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Next
            <IconChevronRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ActivityLedgerSkeleton() {
  return (
    <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-tok-teal/8 px-4 py-4 sm:px-6 sm:py-5">
        <Skeleton className="h-8 w-32 bg-tok-black/5" />
      </div>
      <div className="divide-y divide-tok-black/5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-5 px-6 py-5">
            <Skeleton className="h-10 w-10 rounded-full bg-tok-black/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 bg-tok-black/5" />
              <Skeleton className="h-2 w-24 bg-tok-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
