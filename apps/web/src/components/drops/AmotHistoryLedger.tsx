'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  History as IconHistory, 
  ChevronLeft as IconChevronLeft, 
  ChevronRight as IconChevronRight,
  Receipt as IconReceipt
} from 'lucide-react';
import { useDropActivityLogs } from '@/hooks/queries/use-drops';
import { phraseForDropLogAction } from '@/lib/drop-log-phrases';
import { Skeleton } from '@/components/ui/skeleton';

interface AmotHistoryLedgerProps {
  dropId: string;
}

const AMOT_ACTIONS = [
  'amot_declared',
  'amot_cleared',
  'amot_opted_out',
  'amot_opted_in',
  'amot_rule_out',
  'amot_rule_in',
  'amot_marked_paid',
  'amot_marked_unpaid'
];

export function AmotHistoryLedger({ dropId }: AmotHistoryLedgerProps) {
  const [page, setPage] = useState(1);
  const { data: activityPage, isLoading, isError } = useDropActivityLogs(dropId, page, {
    enabled: Boolean(dropId),
    limit: 6,
    actions: AMOT_ACTIONS
  });

  const formatLogTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLogInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return <AmotHistoryLedgerSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
        <div className="px-6 py-12 text-center">
          <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-red-500">
            Audit failure
          </p>
          <p className="mt-2 font-inter text-xs text-tok-black/45">
            Unable to retrieve amot history.
          </p>
        </div>
      </div>
    );
  }

  if (!activityPage || activityPage.data.length === 0) {
    return null; // Don't show if empty, or show a subtle placeholder
  }

  return (
    <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-amber-400 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconReceipt size={18} strokeWidth={2.5} className="text-tok-black" />
            <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
              Amot-amot History
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
            className="flex items-start gap-5 px-4 py-5 transition-colors hover:bg-amber-50/30 sm:px-6"
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
                <span className="font-medium">{phraseForDropLogAction(log.action, log.changedFields)}</span>
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

export function AmotHistoryLedgerSkeleton() {
  return (
    <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
      <div className="border-b-[3px] border-tok-black bg-amber-400/20 px-4 py-4 sm:px-6 sm:py-5">
        <Skeleton className="h-8 w-48 bg-tok-black/5" />
      </div>
      <div className="divide-y divide-tok-black/5">
        {Array.from({ length: 3 }).map((_, i) => (
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
