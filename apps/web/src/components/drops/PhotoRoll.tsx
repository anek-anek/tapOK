'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Camera as IconCamera,
  Trash2 as IconTrash,
  Star as IconStar,
  Loader2 as IconLoader,
  Plus as IconPlus,
  X as IconX,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dropsService } from '@/services/drops.service';
import { useUploadPhoto, useFeaturePhoto, useDeletePhoto } from '@/hooks/mutations/use-drop-mutations';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ModalShell } from '@/components/modal-shell';
import type { Drop, DropPhoto } from '@/types/drop';

interface PhotoRollProps {
  drop: Drop;
  userId?: string;
  isOrganiser: boolean;
  isCrewMember: boolean;
}

export function PhotoRoll({ drop, userId, isOrganiser, isCrewMember }: PhotoRollProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DropPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['drops', drop.id, 'photos'],
    queryFn: () => dropsService.getPhotos(drop.id),
    enabled: !!drop.id,
  });

  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length, currentIndex]);

  const uploadMutation = useUploadPhoto(drop.id);
  const featureMutation = useFeaturePhoto(drop.id);
  const deleteMutation = useDeletePhoto(drop.id);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('PLEASE SELECT AN IMAGE FILE');
      return;
    }

    setIsCompressing(true);
    try {
      const base64 = await compressImage(file);
      await uploadMutation.mutateAsync(base64);
      toast.success('PHOTO ADDED TO ROLL');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'FAILED TO UPLOAD PHOTO';
      toast.error(Array.isArray(msg) ? msg[0].toUpperCase() : String(msg).toUpperCase());
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFeature = async (photoId: string) => {
    try {
      await featureMutation.mutateAsync(photoId);
      toast.success('PHOTO FEATURED');
    } catch {
      toast.error('FAILED TO FEATURE PHOTO');
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deleteMutation.mutateAsync(photoId);
      toast.success('PHOTO REMOVED');
    } catch {
      toast.error('FAILED TO REMOVE PHOTO');
    }
  };

  const canUpload = isOrganiser || isCrewMember;
  const userPhotos = photos.filter((p: any) => p.userId === userId);
  const reachedUserLimit = userPhotos.length >= 3;
  const reachedTotalLimit = photos.length >= 10;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white/50">
        <IconLoader className="animate-spin text-tok-black/20" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCamera size={18} className="text-tok-black" strokeWidth={2.5} />
          <h3 className="font-passion text-lg font-bold uppercase tracking-wider text-tok-black">Photo Roll</h3>
          <span className="rounded-full bg-tok-black px-2 py-0.5 font-passion text-[10px] font-bold text-white">
            {photos.length}/10
          </span>
        </div>

        {canUpload && !reachedTotalLimit && !reachedUserLimit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || uploadMutation.isPending}
            className="flex h-9 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-yellow px-4 font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
          >
            {isCompressing || uploadMutation.isPending ? (
              <IconLoader size={14} className="animate-spin" />
            ) : (
              <IconPlus size={14} strokeWidth={3} />
            )}
            <span>Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border-[3px] border-dashed border-tok-black/20 bg-tok-black/5 py-12 text-center">
          <IconCamera size={48} className="mb-3 text-tok-black/10" strokeWidth={1} />
          <p className="font-passion text-xs font-bold uppercase tracking-widest text-tok-black/30">
            No moments captured yet
          </p>
          {canUpload && (
            <p className="mt-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/20">
              Be the first to upload!
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop View - Horizontal Scroll */}
          <div className="no-scrollbar hidden sm:flex gap-4 overflow-x-auto pb-4 pt-1 px-1">
            {photos.map((photo: any) => {
              const isOwner = photo.userId === userId;
              const displayUrl = photo.url || photo.base64;

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative h-48 w-40 shrink-0 cursor-pointer overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-black/10 shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1C1C1A] sm:shadow-[4px_4px_0px_#1C1C1A]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrl}
                    alt="Drop moment"
                    className="h-full w-full object-cover"
                  />

                  {/* Attribution Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tok-black/80 to-transparent p-2 pt-6">
                    <p className="truncate font-passion text-[9px] font-bold uppercase tracking-wider text-white">
                      {photo.user?.firstName} {photo.user?.lastName}
                    </p>
                  </div>

                  {/* Featured Badge */}
                  {photo.isFeatured && (
                    <div className="absolute left-2 top-2 rounded-full bg-tok-yellow p-1 shadow-[2px_2px_0px_#1C1C1A] border-2 border-tok-black">
                      <IconStar size={10} className="fill-tok-black text-tok-black" strokeWidth={3} />
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-tok-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {isOrganiser && !photo.isFeatured && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeature(photo.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-yellow text-tok-black transition-all hover:scale-110 active:scale-95"
                        title="Feature this photo"
                      >
                        <IconStar size={14} strokeWidth={2.5} />
                      </button>
                    )}
                    {(isOwner || isOrganiser) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-red-500 text-white transition-all hover:scale-110 active:scale-95"
                        title="Delete photo"
                      >
                        <IconTrash size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile View - Stacked Album/Flipbook Style */}
          <div className="relative flex flex-col items-center sm:hidden pt-4 pb-8">
            <div className="relative h-[320px] w-[260px]">
              <AnimatePresence mode="popLayout">
                {photos.slice().reverse().map((photo: any, index: number) => {
                  const actualIndex = photos.length - 1 - index;
                  // Only show current and next 2 for performance and cleaner look
                  if (actualIndex < currentIndex || actualIndex > currentIndex + 2) return null;
                  
                  const isTop = actualIndex === currentIndex;
                  const offset = actualIndex - currentIndex;
                  
                  return (
                    <motion.div
                      key={photo.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: 20 }}
                      animate={{ 
                        scale: 1 - offset * 0.05, 
                        opacity: 1, 
                        y: offset * -12,
                        x: offset * 4,
                        rotate: isTop ? 0 : (offset % 2 === 0 ? 2 : -2),
                        zIndex: 10 - offset 
                      }}
                      exit={{ x: -300, opacity: 0, rotate: -20, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      onClick={() => isTop && setSelectedPhoto(photo)}
                      className={cn(
                        "absolute inset-0 cursor-pointer overflow-hidden rounded-sm border-[4px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]",
                        !isTop && "pointer-events-none"
                      )}
                    >
                      <img
                        src={photo.url || photo.base64}
                        alt="Drop moment"
                        className="h-full w-full object-cover"
                      />
                      
                      {isTop && (
                        <>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tok-black/80 to-transparent p-3 pt-8">
                            <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-white">
                              {photo.user?.firstName} {photo.user?.lastName}
                            </p>
                          </div>
                          {photo.isFeatured && (
                            <div className="absolute left-3 top-3 rounded-full bg-tok-yellow p-1.5 shadow-[3px_3px_0px_#1C1C1A] border-2 border-tok-black">
                              <IconStar size={12} className="fill-tok-black text-tok-black" strokeWidth={3} />
                            </div>
                          )}
                          
                          {/* Mobile Actions Overlay */}
                          <div className="absolute right-2 top-2 flex flex-col gap-2">
                             {isOrganiser && !photo.isFeatured && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFeature(photo.id);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-yellow text-tok-black shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none"
                              >
                                <IconStar size={16} strokeWidth={2.5} />
                              </button>
                            )}
                            {(photo.userId === userId || isOrganiser) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(photo.id);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-red-500 text-white shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none"
                              >
                                <IconTrash size={16} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center gap-6">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-30"
              >
                <IconChevronLeft size={24} strokeWidth={3} />
              </button>

              <div className="flex gap-2">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full border border-tok-black transition-all",
                      i === currentIndex ? "w-6 bg-tok-black" : "bg-tok-black/20"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(photos.length - 1, prev + 1))}
                disabled={currentIndex === photos.length - 1}
                className="flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-30"
              >
                <IconChevronRight size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        </>
      )}

      {reachedUserLimit && canUpload && !isOrganiser && (
        <p className="text-center font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/40">
          You&apos;ve reached your limit of 3 photos
        </p>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <ModalShell onClose={() => setSelectedPhoto(null)}>
          {(close) => (
            <div className="relative max-w-4xl overflow-hidden rounded-sm border-[4px] border-tok-black bg-tok-black shadow-[12px_12px_0px_#1C1C1A]">
              <button
                onClick={close}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <IconX size={20} strokeWidth={3} />
              </button>
              
              <div className="flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.url || selectedPhoto.base64 || ''}
                  alt="Full moment"
                  className="max-h-[80vh] w-full object-contain bg-tok-black/20"
                />
                
                <div className="border-t-[4px] border-tok-black bg-tok-yellow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40">
                        Captured By
                      </p>
                      <h4 className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
                        {selectedPhoto.user.firstName} {selectedPhoto.user.lastName}
                      </h4>
                    </div>
                    {selectedPhoto.isFeatured && (
                      <div className="flex items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 py-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[3px_3px_0px_#1C1C1A]">
                        <IconStar size={12} className="fill-tok-black text-tok-black" strokeWidth={3} />
                        Featured Moment
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}

/**
 * Compresses image to max 800px width/height and 0.7 quality
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Output as jpeg with 0.7 quality to keep base64 string reasonable
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
