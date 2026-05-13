'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  History as IconHistory, 
  ChevronLeft as IconChevronLeft, 
  ChevronRight as IconChevronRight,
  X as IconX,
  Loader2 as IconLoader
} from 'lucide-react';
import { useDropActivityLogs } from '@/hooks/queries/use-drops';
import { phraseForDropLogAction } from '@/lib/drop-log-phrases';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalShell } from '@/components/modal-shell';

interface AmotLogModalProps {
  dropId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AMOT_ACTIONS = [
  'amot_declared',
  'amot_cleared',
  'amot_opted_out',
  'amot_opted_in',
  'amot_rule_out',
  'amot_rule_in',
  'amot_marked_paid',
  'amot_marked_unpaid',
  'amot_proof_submitted',
  'amot_confirmed_paid'
];

export function AmotLogModal({ dropId, isOpen, onClose }: AmotLogModalProps) {
  const [page, setPage] = useState(1);
  const { data: activityPage, isLoading, isError } = useDropActivityLogs(dropId, page, {
    enabled: isOpen && Boolean(dropId),
    limit: 8,
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

  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative mx-auto flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
        >
          {/* Header */}
          <div className="border-b-[3px] border-tok-black bg-tok-teal px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-white">
                <IconHistory size={20} strokeWidth={2.5} />
                <h2 className="font-passion text-2xl font-bold uppercase tracking-tight">
                  Amot-amot Log
                </h2>
              </div>
              <button
                onClick={close}
                className="rounded-sm border-2 border-tok-black bg-white p-1 text-tok-black transition-colors hover:bg-red-50"
              >
                <IconX size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-tok-black/20">
                <IconLoader size={40} className="animate-spin mb-4" />
                <p className="font-passion text-lg font-bold uppercase tracking-widest">Scanning history...</p>
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-red-500">
                  Mission intelligence failure
                </p>
                <p className="mt-2 font-inter text-xs text-tok-black/45">
                  Failed to retrieve amot logs.
                </p>
              </div>
            ) : !activityPage || activityPage.data.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-tok-black/20">
                  No amot activity recorded
                </p>
                <p className="mt-2 font-inter text-xs text-tok-black/45">
                  History begins when amot costs are declared.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activityPage.data.map((log) => (
                  <div
                    key={log.id}
                    className="group relative flex items-start gap-4 rounded-sm border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal/10 font-passion text-[10px] font-bold text-tok-teal">
                      {log.user.avatar ? (
                        <Image src={log.user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        getLogInitials(log.user.firstName, log.user.lastName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-inter text-sm leading-relaxed text-tok-black/80">
                        <span className="font-passion text-sm font-bold uppercase tracking-tight text-tok-black">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        {' '}
                        <span className="font-medium text-tok-black/60">
                          {phraseForDropLogAction(log.action, log.changedFields)}
                        </span>
                      </p>
                      <p className="mt-2 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/30">
                        {formatLogTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          {activityPage && activityPage.totalPages > 1 && (
            <div className="flex items-center justify-between border-t-[3px] border-tok-black bg-tok-cream px-6 py-4">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="flex items-center gap-1.5 rounded-sm border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <IconChevronLeft size={12} strokeWidth={2.5} />
                Prev
              </button>
              <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                Page {page} / {activityPage.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === activityPage.totalPages}
                className="flex items-center gap-1.5 rounded-sm border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                Next
                <IconChevronRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </ModalShell>
  );
}
