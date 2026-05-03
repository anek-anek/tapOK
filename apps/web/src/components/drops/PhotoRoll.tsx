'use client';

import { useState, useRef, useEffect, useMemo, type MouseEvent, type DragEvent } from 'react';
import NextImage from 'next/image';
import axios from 'axios';
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
import { DeletePhotoModal } from './DeletePhotoModal';
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
  const [photoToDelete, setPhotoToDelete] = useState<DropPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const blockImageContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  const blockImageDrag = (event: DragEvent) => {
    event.preventDefault();
  };

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['drops', drop.id, 'photos'],
    queryFn: () => dropsService.getPhotos(drop.id),
    enabled: !!drop.id && (isOrganiser || isCrewMember),
  });

  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length, currentIndex]);

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSaveShortcut) return;
      event.preventDefault();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, []);

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
      toast.success('POSTED A NEW SHOT TO THE ROLL');
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error((t) => (
          <div className="flex flex-col gap-3">
            <p className="font-passion text-xs font-bold uppercase tracking-wider">{err.response?.data?.message}</p>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/profile?verify=true';
              }}
              className="rounded-sm border-2 border-white bg-white px-3 py-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black transition-all hover:bg-white/90"
            >
              Go to Profile
            </button>
          </div>
        ), { duration: 6000 });
      } else {
        const msg = err.response?.data?.message || 'FAILED TO POST SHOT TO THE ROLL';
        toast.error(Array.isArray(msg) ? msg[0].toUpperCase() : String(msg).toUpperCase());
      }
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFeature = async (photoId: string) => {
    const photo = photos.find((p: any) => p.id === photoId);
    const isUnfeaturing = photo?.isFeatured;

    if (!isUnfeaturing && reachedFeaturedLimit) {
      toast.error('MAX 5 SPOTLIGHTS ON THE ROLL');
      return;
    }

    try {
      await featureMutation.mutateAsync(photoId);
      toast.success(isUnfeaturing ? 'CLEARED THE SPOTLIGHT' : 'SPOTLIGHTED A MOMENT');
    } catch {
      toast.error(isUnfeaturing ? 'FAILED TO CLEAR THE SPOTLIGHT' : 'FAILED TO SPOTLIGHT');
    }
  };

  const handleDelete = (photo: DropPhoto) => {
    setPhotoToDelete(photo);
  };

  const isCompleted = drop.status === 'completed';
  const canUpload = (isOrganiser || isCrewMember) && !isCompleted;
  const userPhotos = photos.filter((p: any) => p.userId === userId);
  const reachedUserLimit = userPhotos.length >= 3;
  const reachedTotalLimit = photos.length >= 10;
  const featuredPhotos = photos.filter((p: any) => p.isFeatured);
  const reachedFeaturedLimit = featuredPhotos.length >= 5;
  const displayedPhotos = useMemo(() => {
    if (isCompleted) {
      return photos.filter((p) => p.isFeatured);
    }
    const featured = photos.filter((p) => p.isFeatured);
    const nonFeatured = photos.filter((p) => !p.isFeatured);
    return [...featured, ...nonFeatured];
  }, [photos, isCompleted]);

  // Hide the section if viewer is neither organiser nor crew.
  if (!isOrganiser && !isCrewMember) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white/50">
        <IconLoader className="animate-spin text-tok-black/20" size={32} />
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCamera size={18} className="text-tok-black" strokeWidth={2.5} />
          <h3 className="font-passion text-lg font-bold uppercase tracking-wider text-tok-black">
            {isCompleted ? 'Mission Highlights' : 'Photo Roll'}
          </h3>
          {isCompleted && (
            <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-tok-black/40">
              (Curated)
            </span>
          )}
        </div>

        {canUpload && !reachedTotalLimit && displayedPhotos.length > 0 && (
          <button
            onClick={() => !reachedUserLimit && fileInputRef.current?.click()}
            disabled={isCompressing || uploadMutation.isPending || reachedUserLimit}
            className={cn(
              "flex h-9 items-center gap-2 rounded-sm border-[3px] border-tok-black px-4 font-passion text-[11px] font-bold uppercase tracking-wider transition-all",
              reachedUserLimit
                ? "bg-tok-black/5 text-tok-black/40 border-tok-black/20 cursor-not-allowed"
                : "bg-tok-yellow text-tok-black shadow-[3px_3px_0px_#1C1C1A] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
            )}
          >
            {reachedUserLimit ? (
              <span>Limit Reached</span>
            ) : (
              <>
                {isCompressing || uploadMutation.isPending ? (
                  <IconLoader size={14} className="animate-spin" />
                ) : (
                  <IconPlus size={14} strokeWidth={3} />
                )}
                <span>Add Photo</span>
              </>
            )}
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

      {displayedPhotos.length === 0 ? (
        <div className="rounded-[4px] border-[3px] border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border-2 border-tok-black bg-white">
              <IconCamera size={16} className="text-tok-black/40" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-passion text-[12px] font-bold uppercase tracking-[1.8px] text-tok-black">
                {isCompleted ? 'No highlights yet' : 'Photo roll is empty'}
              </p>
              <p className="mt-0.5 font-inter text-[11px] text-tok-black/45">
                {isCompleted ? 'No featured moments were saved.' : 'Be the first to capture one.'}
              </p>
            </div>
            {canUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing || uploadMutation.isPending || reachedUserLimit || reachedTotalLimit}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] border-[3px] border-tok-black bg-tok-yellow px-3 font-passion text-[10px] font-bold uppercase tracking-[1.2px] text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCompressing || uploadMutation.isPending ? (
                  <IconLoader size={12} className="animate-spin" />
                ) : (
                  <IconPlus size={12} strokeWidth={3} />
                )}
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      ) : (
      <>
        {/* Desktop View - Horizontal Scroll */}
        <div className="no-scrollbar hidden sm:flex gap-4 overflow-x-auto pb-4 pt-1 px-1">
          {displayedPhotos.map((photo: any) => {
            const isOwner = photo.userId === userId;
            const displayUrl = photo.url || photo.base64;

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative h-48 w-40 shrink-0 cursor-pointer overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-black/10 shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1C1C1A] sm:shadow-[4px_4px_0px_#1C1C1A]"
              >
                { }
                <NextImage
                  src={displayUrl}
                  alt="Drop moment"
                  fill
                  className="object-cover"
                  sizes="160px"
                  draggable={false}
                  onContextMenu={blockImageContextMenu}
                  onDragStart={blockImageDrag}
                />

                  {/* Attribution Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-tok-black/80 to-transparent p-2 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 font-passion text-[6px] font-bold text-white">
                        {photo.user?.avatar ? (
                          <NextImage src={photo.user.avatar} alt="" width={16} height={16} className="h-full w-full object-cover" />
                        ) : (
                          (photo.user?.firstName?.[0] || '') + (photo.user?.lastName?.[0] || '')
                        )}
                      </div>
                      <p className="truncate font-passion text-[9px] font-bold uppercase tracking-wider text-white">
                        {photo.user?.firstName} {photo.user?.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {photo.isFeatured && (
                    <div className="absolute left-2 top-2 rounded-full bg-tok-yellow p-1 shadow-[2px_2px_0px_#1C1C1A] border-2 border-tok-black">
                      <IconStar size={10} className="fill-tok-black text-tok-black" strokeWidth={3} />
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-tok-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {isOrganiser && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          !featureMutation.isPending && handleFeature(photo.id);
                        }}
                        disabled={featureMutation.isPending}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black transition-all hover:scale-110 active:scale-95 disabled:opacity-50",
                          photo.isFeatured ? "bg-white text-tok-black" : "bg-tok-yellow text-tok-black"
                        )}
                        title={photo.isFeatured ? "Unfeature this photo" : "Feature this photo"}
                      >
                        {featureMutation.isPending ? (
                          <IconLoader size={12} className="animate-spin" />
                        ) : (
                          <IconStar size={14} strokeWidth={2.5} className={photo.isFeatured ? "fill-tok-black" : ""} />
                        )}
                      </button>
                    )}
                    {(isOwner || isOrganiser) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo);
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
                {displayedPhotos.slice().reverse().map((photo: any, index: number) => {
                  const actualIndex = displayedPhotos.length - 1 - index;
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
                        "absolute inset-0 cursor-pointer overflow-hidden rounded-sm border-4 border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]",
                        !isTop && "pointer-events-none"
                      )}
                    >
                      <NextImage
                        src={photo.url || photo.base64}
                        alt="Drop moment"
                        fill
                        className="object-cover"
                        sizes="260px"
                        draggable={false}
                        onContextMenu={blockImageContextMenu}
                        onDragStart={blockImageDrag}
                      />

                      {isTop && (
                        <>
                          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-tok-black/80 to-transparent p-3 pt-8">
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 font-passion text-[8px] font-bold text-white">
                                {photo.user?.avatar ? (
                                  <NextImage src={photo.user.avatar} alt="" width={20} height={20} className="h-full w-full object-cover" />
                                ) : (
                                  (photo.user?.firstName?.[0] || '') + (photo.user?.lastName?.[0] || '')
                                )}
                              </div>
                              <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-white">
                                {photo.user?.firstName} {photo.user?.lastName}
                              </p>
                            </div>
                          </div>
                          {photo.isFeatured && (
                            <div className="absolute left-3 top-3 rounded-full bg-tok-yellow p-1.5 shadow-[3px_3px_0px_#1C1C1A] border-2 border-tok-black">
                              <IconStar size={12} className="fill-tok-black text-tok-black" strokeWidth={3} />
                            </div>
                          )}

                          {/* Mobile Actions Overlay */}
                          <div className="absolute right-2 top-2 flex flex-col gap-2">
                            {isOrganiser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  !featureMutation.isPending && handleFeature(photo.id);
                                }}
                                disabled={featureMutation.isPending}
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none disabled:opacity-50",
                                  photo.isFeatured ? "bg-white text-tok-black" : "bg-tok-yellow text-tok-black"
                                )}
                              >
                                {featureMutation.isPending ? (
                                  <IconLoader size={16} className="animate-spin" />
                                ) : (
                                  <IconStar size={16} strokeWidth={2.5} className={photo.isFeatured ? "fill-tok-black" : ""} />
                                )}
                              </button>
                            )}
                            {(photo.userId === userId || isOrganiser) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(photo);
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
                {displayedPhotos.map((_, i) => (
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
                onClick={() => setCurrentIndex(prev => Math.min(displayedPhotos.length - 1, prev + 1))}
                disabled={currentIndex === displayedPhotos.length - 1}
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
            <div className="relative max-w-4xl overflow-hidden rounded-sm border-4 border-tok-black bg-tok-black shadow-[12px_12px_0px_#1C1C1A]">
              <button
                onClick={close}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <IconX size={20} strokeWidth={3} />
              </button>

              <div className="flex flex-col">
                { }
                <NextImage
                  src={selectedPhoto.url || selectedPhoto.base64 || ''}
                  alt="Full moment"
                  width={1200}
                  height={800}
                  className="max-h-[80vh] w-full object-contain bg-tok-black/20"
                  draggable={false}
                  onContextMenu={blockImageContextMenu}
                  onDragStart={blockImageDrag}
                />

                <div className="border-t-4 border-tok-black bg-tok-yellow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-white font-passion text-xs font-bold text-tok-black">
                        {selectedPhoto.user.avatar ? (
                          <NextImage src={selectedPhoto.user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
                        ) : (
                          (selectedPhoto.user.firstName?.[0] || '') + (selectedPhoto.user.lastName?.[0] || '')
                        )}
                      </div>
                      <div>
                        <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40">
                          Captured By
                        </p>
                        <h4 className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
                          {selectedPhoto.user.firstName} {selectedPhoto.user.lastName}
                        </h4>
                      </div>
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

      {/* Delete Photo Modal */}
      {photoToDelete && (
        <DeletePhotoModal
          dropId={drop.id}
          photo={photoToDelete}
          onClose={() => setPhotoToDelete(null)}
        />
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
