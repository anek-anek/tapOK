'use client';

import { useState } from 'react';
import { useAllDrops } from '@/hooks/queries/use-drops';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { format } from 'date-fns';
import { AdminDropSummaryModal } from './admin-summary-modals';
import { ConfirmModal } from '../shared/ConfirmModal';
import { api } from '@/services/api';
import type { Drop } from '@/types/drop';

export function AdminDropsTab() {
  const { data: drops, isLoading } = useAllDrops();
  const queryClient = useQueryClient();
  const [confirmModalId, setConfirmModalId] = useState<string | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/drops/${id}`);
      queryClient.invalidateQueries({ queryKey: ['drops'] });
      setConfirmModalId(null);
    } catch (error) {
      console.error('Failed to delete drop:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-sm border-[3px] border-tok-black/10 bg-white/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ConfirmModal
        isOpen={!!confirmModalId}
        onClose={() => setConfirmModalId(null)}
        onConfirm={() => confirmModalId && handleDelete(confirmModalId)}
        title="Delete Drop?"
        description="Are you sure you want to delete this drop? This will also delete all associated data (photos, logs, crew). This action is permanent."
        confirmText="Delete Drop"
        isLoading={isDeleting}
      />
      <AdminDropSummaryModal
        isOpen={!!selectedDrop}
        onClose={() => setSelectedDrop(null)}
        drop={selectedDrop}
      />
      {drops?.map((drop: Drop) => (
        <div key={drop.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A] gap-4 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer" onClick={() => setSelectedDrop(drop)}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-black/5 overflow-hidden relative">
              {drop.coverPhoto ? (
                <Image src={drop.coverPhoto} alt={drop.name} fill className="object-cover" />
              ) : (
                <Calendar className="text-tok-black/20" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-passion text-lg uppercase tracking-tight text-tok-black truncate">
                {drop.name}
              </p>
              <p className="font-inter text-xs font-bold text-tok-black/40 lowercase truncate">
                {format(new Date(drop.scheduledAt), 'MMM d, yyyy')} • Chief: {drop.organiser?.firstName} {drop.organiser?.lastName}
              </p>
            </div>
          </div>
          <div className="flex sm:justify-end">
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModalId(drop.id);
              }}
              className="rounded-sm border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none w-full sm:w-10 h-10"
            >
              <Trash2 size={18} className="sm:mx-0" />
              <span className="sm:hidden ml-2 font-passion uppercase text-xs tracking-widest">Delete Drop</span>
            </Button>
          </div>
        </div>
      ))}
      {drops?.length === 0 && (
        <div className="py-12 text-center text-tok-black/40 font-passion uppercase tracking-widest">No drops found.</div>
      )}
    </div>
  );
}
