'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateFeedback, FeedbackType } from '@/hooks/queries/use-feedback';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Sparkles, ShieldAlert, X, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalShell } from '@/components/modal-shell';

const feedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['bug', 'feature'] as const),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackDialogProps {
  onClose: () => void;
}

export function FeedbackDialog({ onClose }: FeedbackDialogProps) {
  const createMutation = useCreateFeedback();
  const [selectedType, setSelectedType] = useState<FeedbackType>('feature');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { type: 'feature' },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Transmission received by HQ Monitor.');
        onClose();
      },
      onError: () => {
        toast.error('Transmission failed. Re-syncing...');
      },
    });
  };

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <div className="mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[10px_10px_0px_#1C1C1A]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-[3px] border-tok-black bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-teal text-tok-cream shadow-[3px_3px_0px_#1C1C1A]">
                <Radio size={20} strokeWidth={2.5} />
              </div>
              <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                New Transmission
              </h2>
            </div>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:bg-tok-black/5 active:bg-tok-black/10"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              {/* Type Selector */}
              <div className="space-y-2">
                <label className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  Signal Category
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedType('feature'); setValue('type', 'feature'); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-sm border-[3px] py-3 transition-all font-passion text-sm font-black uppercase tracking-widest",
                      selectedType === 'feature'
                        ? "border-tok-black bg-tok-teal text-tok-cream shadow-[4px_4px_0px_#1C1C1A]"
                        : "border-tok-black bg-white text-tok-black hover:bg-tok-black/5"
                    )}
                  >
                    <Sparkles size={16} strokeWidth={2.5} />
                    Upgrade
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedType('bug'); setValue('type', 'bug'); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-sm border-[3px] py-3 transition-all font-passion text-sm font-black uppercase tracking-widest",
                      selectedType === 'bug'
                        ? "border-tok-black bg-tok-black text-tok-cream shadow-[4px_4px_0px_#1C1C1A]"
                        : "border-tok-black bg-white text-tok-black hover:bg-tok-black/5"
                    )}
                  >
                    <ShieldAlert size={16} strokeWidth={2.5} />
                    Malfunction
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  Intel Title
                </label>
                <input
                  {...register('title')}
                  placeholder="Brief summary of the signal..."
                  className="w-full rounded-sm border-[3px] border-tok-black bg-white p-4 font-inter text-sm outline-none transition-all placeholder:text-tok-black/30 focus:shadow-[4px_4px_0px_#1C1C1A]"
                />
                {errors.title && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  Detailed Broadcast
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe the malfunction or requested upgrade in detail..."
                  className="w-full rounded-sm border-[3px] border-tok-black bg-white p-4 font-inter text-sm outline-none transition-all placeholder:text-tok-black/30 focus:shadow-[4px_4px_0px_#1C1C1A] resize-none"
                />
                {errors.description && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 border-t-[3px] border-tok-black bg-white p-6 pr-7">
              <button
                type="button"
                onClick={close}
                disabled={createMutation.isPending}
                className="flex h-14 flex-1 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white font-passion text-sm font-bold uppercase tracking-[2px] text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-teal font-passion text-sm font-bold uppercase tracking-[2px] text-tok-cream shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Transmit Signal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </ModalShell>
  );
}
