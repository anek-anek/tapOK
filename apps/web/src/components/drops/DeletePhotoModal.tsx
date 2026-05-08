'use client';

import { CLOSE_DURATION, ModalShell } from '@/components/modal-shell';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import NextImage from 'next/image';
import { useDeletePhoto } from '@/hooks/mutations/use-drop-mutations';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { usePhotoDetail } from '@/hooks/queries/use-drops';
import type { DropPhoto } from '@/types/drop';

interface DeletePhotoModalProps {
  dropId: string;
  photo: DropPhoto;
  onClose: (deleted?: boolean) => void;
}

export function DeletePhotoModal({ dropId, photo, onClose }: DeletePhotoModalProps) {
  const deletePhoto = useDeletePhoto(dropId);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: detail } = usePhotoDetail(dropId, photo.id, {
    enabled: !photo.url && !photo.base64,
  });

  const displaySrc = photo.url || photo.base64 || detail?.base64;

  const handleDelete = async (close: () => void) => {
    setIsDeleting(true);
    try {
      await deletePhoto.mutateAsync(photo.id);
      toast.success('REMOVED A SHOT FROM THE ROLL');
      close();
      setTimeout(() => onClose(true), CLOSE_DURATION);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FAILED TO REMOVE SHOT FROM THE ROLL';
      toast.error(String(msg).toUpperCase());
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalShell onClose={() => !isDeleting && onClose()}>
      {(close) => (
        <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[10px_10px_0px_#1C1C1A]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-[3px] border-tok-black bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-red-100 text-red-600 shadow-[3px_3px_0px_#1C1C1A]">
                <Trash2 size={20} strokeWidth={2.5} />
              </div>
              <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                Delete Photo
              </h2>
            </div>
            {!isDeleting && (
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:bg-tok-black/5 active:bg-tok-black/10"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex flex-col gap-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-sm border-[3px] border-tok-black shadow-[6px_6px_0px_#1C1C1A]">
                {displaySrc ? (
                  <NextImage
                    src={displaySrc}
                    alt="To be deleted"
                    fill
                    className="object-cover grayscale opacity-60"
                  />
                ) : (
                  <div className="h-full w-full bg-tok-black/10" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                  <Trash2 size={48} className="text-red-500/40" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex gap-4 rounded-sm bg-amber-50 p-6 border-l-[6px] border-amber-400">
                <AlertTriangle className="shrink-0 text-amber-500" size={24} />
                <div className="space-y-1">
                  <p className="font-passion text-xs font-bold uppercase tracking-[1.5px] text-amber-600">
                    Confirm Removal
                  </p>
                  <p className="text-[14px] leading-relaxed text-tok-black/70">
                    Are you sure you want to remove this moment from the roll? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 border-t-[3px] border-tok-black bg-white p-6">
            <button
              onClick={close}
              disabled={isDeleting}
              className="flex h-16 flex-1 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white font-passion text-base font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:bg-tok-black/5 active:translate-y-0 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleDelete(close)}
              disabled={isDeleting}
              className="flex h-16 flex-1 items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black bg-red-500 font-passion text-base font-bold uppercase tracking-[2px] text-white shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              {isDeleting ? 'Removing...' : 'Delete Photo'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
