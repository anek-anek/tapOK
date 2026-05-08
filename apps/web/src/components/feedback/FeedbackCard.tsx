'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SignalSlider } from './SignalSlider';
import { Feedback, useVoteFeedback, useDeleteFeedback } from '@/hooks/queries/use-feedback';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { User, Clock, CheckCircle2, AlertCircle, Timer, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../shared/ConfirmModal';

interface FeedbackCardProps {
  feedback: Feedback;
}

const STATUS_CONFIG = {
  pending: { icon: Timer, color: 'text-tok-black/40', label: 'PENDING' },
  investigating: { icon: AlertCircle, color: 'text-amber-600', label: 'SCANNING' },
  resolved: { icon: CheckCircle2, color: 'text-tok-teal', label: 'RESOLVED' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'DISCARDED' },
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { dbUser } = useAuth();
  const voteMutation = useVoteFeedback();
  const deleteMutation = useDeleteFeedback();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusInfo = STATUS_CONFIG[feedback.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const isOwner = dbUser?.id === feedback.creatorId;

  const handleVote = (value: number) => {
    voteMutation.mutate({ id: feedback.id, value });
  };

  const handleDelete = () => {
    deleteMutation.mutate(feedback.id, {
      onSuccess: () => {
        toast.success('Transmission deleted.');
        setShowDeleteModal(false);
      },
      onError: () => toast.error('Failed to delete transmission.'),
    });
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-sm border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#1C1C1A]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-tok-black/10 bg-white p-5">
          <div className="flex-1 space-y-1 min-w-0">
            <h3 className="font-passion text-xl font-black uppercase leading-tight tracking-tight text-tok-black truncate">
              {feedback.title}
            </h3>
            <div className="flex items-center gap-3 text-tok-black/40 flex-wrap">
              <div className="flex items-center gap-1.5 font-passion text-[10px] font-bold uppercase tracking-widest">
                <StatusIcon size={11} className={statusInfo.color} />
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-tok-black/10" />
              <div className="flex items-center gap-1.5 font-passion text-[10px] font-bold uppercase tracking-widest">
                <Clock size={11} />
                {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Type Badge */}
            <span className={cn(
              "inline-flex items-center rounded-sm border-2 border-tok-black px-2 py-0.5 font-passion text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#1C1C1A]",
              feedback.type === 'bug' ? "bg-tok-black text-tok-cream" : "bg-tok-teal text-tok-cream"
            )}>
              {feedback.type === 'bug' ? 'MALFUNCTION' : 'UPGRADE'}
            </span>

            {/* Delete Button (own posts only) */}
            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-tok-black/20 bg-white text-tok-black/30 transition-all hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                title="Delete transmission"
              >
                <Trash2 size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4">
          <p className="text-sm leading-relaxed text-tok-black/70">
            {feedback.description}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-tok-black bg-tok-cream text-tok-black shrink-0">
              <User size={12} />
            </div>
            <p className="font-passion text-[10px] font-bold uppercase tracking-widest text-tok-black/60">
              {feedback.creator.firstName} {feedback.creator.lastName}
            </p>
          </div>
        </div>

        {/* Footer — Boost / Jam */}
        <div className="border-t-[3px] border-tok-black/10 px-5 pb-5">
          <SignalSlider
            score={feedback.score}
            currentVote={feedback.viewerVote}
            onBoost={() => handleVote(1)}
            onJam={() => handleVote(-1)}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Transmission?"
        description="Are you sure you want to delete this signal? This action cannot be reversed."
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
}
