'use client';

import { useState } from 'react';
import { useFeedback, Feedback } from '@/hooks/queries/use-feedback';
import { AdminFeedbackSummaryModal } from './admin-summary-modals';
import { formatDistanceToNow } from 'date-fns';
import { Clock, MessageSquare, Signal, Timer, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { icon: Timer, color: 'text-tok-black/40', label: 'PENDING' },
  investigating: { icon: AlertCircle, color: 'text-amber-600', label: 'SCANNING' },
  resolved: { icon: CheckCircle2, color: 'text-tok-teal', label: 'RESOLVED' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'DISCARDED' },
};

export function AdminFeedbackTab() {
  const { data: feedbackItems, isLoading } = useFeedback(undefined, 'score');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-sm border-[3px] border-tok-black/10 bg-white/50" />
        ))}
      </div>
    );
  }

  if (!feedbackItems || feedbackItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-sm border-[3px] border-dashed border-tok-black/10 bg-white/30 text-tok-black/30">
        <Signal size={48} className="mb-4 opacity-20" />
        <p className="font-passion text-lg font-bold uppercase tracking-[2px]">No transmissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-2 px-2">
        <MessageSquare size={16} className="text-tok-teal" />
        <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
          Signal Stream ({feedbackItems.length} active)
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {feedbackItems.map((item) => {
          const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={item.id}
              onClick={() => handleRowClick(item)}
              className="group flex cursor-pointer items-center justify-between gap-4 rounded-sm border-[3px] border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className="font-passion text-lg font-black uppercase leading-tight tracking-tight text-tok-black truncate">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 text-tok-black/40">
                  <div className="flex items-center gap-1 font-passion text-[10px] font-bold uppercase tracking-widest">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-tok-black/10" />
                  <div className={cn("flex items-center gap-1 font-passion text-[10px] font-bold uppercase tracking-widest", statusInfo.color)}>
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-sm border-2 border-tok-black px-2 py-0.5 font-passion text-[9px] font-black uppercase tracking-widest",
                  item.type === 'bug' ? "bg-red-500 text-white" : "bg-tok-teal text-tok-cream"
                )}>
                  {item.type === 'bug' ? 'BUG' : 'UPGRADE'}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-cream group-hover:bg-tok-black group-hover:text-tok-cream transition-colors">
                    <Signal size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AdminFeedbackSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedback={selectedFeedback}
      />
    </div>
  );
}
