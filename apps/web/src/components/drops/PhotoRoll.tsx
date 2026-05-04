'use client';

import { useState, useRef, useEffect, useMemo, type MouseEvent, type DragEvent } from 'react';
import NextImage from 'next/image';
import axios from 'axios';
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
import { useInfinitePhotos, usePhotoDetail } from '@/hooks/queries/use-drops';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ModalShell } from '@/components/modal-shell';
import { DeletePhotoModal } from './DeletePhotoModal';
import type { Drop, DropPhoto } from '@/types/drop';

interface PhotoRollProps {
  drop: Drop;
  userId?: string;
  isOrganiser: boolean;
  isCrewMember: boolean;
  isLoadingStatus?: boolean;
}

export function PhotoRoll({ drop, userId, isOrganiser, isCrewMember, isLoadingStatus }: PhotoRollProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<DropPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const {
    data: infiniteData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfinitePhotos(drop.id, {
    enabled: !!drop.id && (isOrganiser || isCrewMember),
  });

  const photos = useMemo(() =>
    infiniteData?.pages.flatMap((page: any) => page.data) ?? [],
    [infiniteData]
  );

  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1);
    }
    // Pre-fetch next page when near the end
    if (hasNextPage && !isFetchingNextPage && currentIndex >= photos.length - 3) {
      void fetchNextPage();
    }
  }, [photos.length, currentIndex, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const uploadMutation = useUploadPhoto(drop.id);
  const featureMutation = useFeaturePhoto(drop.id);

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
        toast.error((t: any) => (
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
    if (!isUnfeaturing && photos.filter((p: any) => p.isFeatured).length >= 5) {
      toast.error('MAX 5 SPOTLIGHTS ON THE ROLL');
      return;
    }

    try {
      await featureMutation.mutateAsync(photoId);
      toast.success(isUnfeaturing ? 'CLEARED THE SPOTLIGHT' : 'SPOTLIGHTED A MOMENT');
    } catch (err: any) {
      const msg = err.response?.data?.message || (isUnfeaturing ? 'FAILED TO CLEAR THE SPOTLIGHT' : 'FAILED TO SPOTLIGHT');
      toast.error(String(msg).toUpperCase());
    }
  };

  const isCompleted = drop.status === 'completed';
  const canUpload = (isOrganiser || isCrewMember) && !isCompleted;
  const userPhotos = photos.filter((p: any) => p.userId === userId);
  const reachedUserLimit = userPhotos.length >= 3;
  const reachedTotalLimit = photos.length >= 50;

  const displayedPhotos = useMemo(() => {
    if (isCompleted) return photos.filter((p: any) => p.isFeatured);
    const featured = photos.filter((p: any) => p.isFeatured);
    const nonFeatured = photos.filter((p: any) => !p.isFeatured);
    return [...featured, ...nonFeatured];
  }, [photos, isCompleted]);

  if (isLoadingStatus || isLoading) {
    return <PhotoRollSkeleton />;
  }

  if (!isOrganiser && !isCrewMember) return null;

  if (isError) return null;

  return (
    <div className="py-6 space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {displayedPhotos.length === 0 ? (
        <PhotoRollEmptyStack
          isCompleted={isCompleted}
          canUpload={canUpload}
          isCompressing={isCompressing}
          isUploadPending={uploadMutation.isPending}
          reachedUserLimit={reachedUserLimit}
          onAddClick={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="relative flex flex-col items-center pt-4 pb-8">
          <div className="relative h-[320px] w-[320px] md:h-[400px] md:w-[400px] flex items-center justify-center">
            <AnimatePresence mode="sync" initial={false}>
              {displayedPhotos.slice().reverse().map((photo: any, index: number) => {
                const actualIndex = displayedPhotos.length - 1 - index;
                if (actualIndex < currentIndex || actualIndex > currentIndex + 2) return null;
                const isTop = actualIndex === currentIndex;
                const offset = actualIndex - currentIndex;

                return (
                  <PhotoStackItem
                    key={photo.id}
                    dropId={drop.id}
                    photo={photo}
                    isTop={isTop}
                    offset={offset}
                    direction={direction}
                    onSelect={() => setSelectedPhotoId(photo.id)}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => {
                  setDirection(-1);
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentIndex === 0}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-20"
              >
                <IconChevronLeft size={28} strokeWidth={3} />
              </button>

              <div className="flex max-w-[120px] gap-2 overflow-hidden px-1">
                {displayedPhotos.map((_: any, i: number) => (
                  <div key={i} className={cn("h-2 w-2 shrink-0 rounded-full border border-tok-black transition-all", i === currentIndex ? "w-6 bg-tok-black" : "bg-tok-black/20")} />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDirection(1);
                  if (currentIndex === displayedPhotos.length - 1) {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    return;
                  }
                  setCurrentIndex(prev => prev + 1);
                }}
                disabled={currentIndex === displayedPhotos.length - 1 && !hasNextPage}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-20"
              >
                {isFetchingNextPage ? <IconLoader size={20} className="animate-spin" /> : <IconChevronRight size={28} strokeWidth={3} />}
              </button>
            </div>

            {canUpload && !reachedTotalLimit && !reachedUserLimit && displayedPhotos.length > 0 && (
              <>
                <span className="hidden h-8 w-[3px] shrink-0 rounded-full bg-tok-black/15 sm:block" aria-hidden />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing || uploadMutation.isPending}
                  title="Add photo"
                  aria-label="Add photo"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-yellow text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto sm:min-w-[7.5rem] sm:gap-2 sm:px-3 disabled:opacity-60"
                >
                  {isCompressing || uploadMutation.isPending ? (
                    <IconLoader size={20} className="animate-spin" />
                  ) : (
                    <>
                      <IconPlus size={22} strokeWidth={3} className="sm:hidden" />
                      <IconPlus size={16} strokeWidth={3} className="hidden sm:block" />
                      <span className="hidden font-passion text-[10px] font-bold uppercase tracking-wider sm:inline">
                        Add
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {selectedPhotoId && (
        <PhotoViewerModal
          dropId={drop.id}
          photoId={selectedPhotoId}
          onClose={() => setSelectedPhotoId(null)}
          isOrganiser={isOrganiser}
          userId={userId}
          onFeature={() => handleFeature(selectedPhotoId)}
          onDelete={() => {
            const photoObj = displayedPhotos.find(p => p.id === selectedPhotoId);
            if (photoObj) setPhotoToDelete(photoObj);
          }}
          isFeaturePending={featureMutation.isPending}
        />
      )}

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

function emptyStackCardDims(orientation: 'portrait' | 'landscape') {
  return orientation === 'portrait'
    ? { width: 'min(280px, 75vw)', height: 'min(360px, 90vw)' }
    : { width: 'min(440px, 95vw)', height: 'min(340px, 80vw)' };
}

/** Back → front: portrait, landscape, portrait (mixed aspects like a real roll). */
const EMPTY_PHOTO_STACK_LAYERS = [
  {
    orientation: 'portrait' as const,
    zIndex: 8,
    opacity: 0.5,
    transform: 'rotate(4deg) translate(10px, -28px)',
  },
  {
    orientation: 'landscape' as const,
    zIndex: 9,
    opacity: 0.68,
    transform: 'rotate(-3deg) translate(2px, -6px)',
  },
  {
    orientation: 'portrait' as const,
    zIndex: 10,
    opacity: 1,
    transform: 'rotate(-1deg) translate(-2px, 4px)',
    isFront: true,
  },
];

function PhotoRollEmptyStack({
  isCompleted,
  canUpload,
  isCompressing,
  isUploadPending,
  reachedUserLimit,
  onAddClick,
}: {
  isCompleted: boolean;
  canUpload: boolean;
  isCompressing: boolean;
  isUploadPending: boolean;
  /** When true, hide the add control (per-user photo cap). */
  reachedUserLimit: boolean;
  onAddClick: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center pt-4 pb-8">
      <div className="relative flex h-[320px] w-[320px] items-center justify-center overflow-visible md:h-[400px] md:w-[400px]">
        {EMPTY_PHOTO_STACK_LAYERS.map((layer, idx) => {
          const dims = emptyStackCardDims(layer.orientation);
          return (
            <div
              key={idx}
              className={cn(
                'absolute flex min-h-0 flex-col rounded-sm border-[4px] border-tok-black bg-white p-3 shadow-[8px_8px_0px_#1C1C1A]',
                layer.isFront ? 'pointer-events-auto' : 'pointer-events-none',
              )}
              style={{
                ...dims,
                zIndex: layer.zIndex,
                transform: layer.transform,
                opacity: layer.opacity,
              }}
              aria-hidden={!layer.isFront}
            >
              {layer.isFront ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 border-2 border-tok-black bg-tok-cream/25 p-4 text-center sm:p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
                    <IconCamera size={26} className="text-tok-black/35" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-passion text-sm font-bold uppercase tracking-[1.8px] text-tok-black">
                      {isCompleted ? 'No highlights yet' : 'Photo roll is empty'}
                    </p>
                    <p className="font-inter text-xs leading-relaxed text-tok-black/50">
                      {isCompleted
                        ? 'No featured moments were saved for this drop.'
                        : 'Be the first to post a moment to the stack.'}
                    </p>
                  </div>
                  {canUpload && !reachedUserLimit && (
                    <button
                      type="button"
                      onClick={onAddClick}
                      disabled={isCompressing || isUploadPending}
                      className="mt-1 flex h-10 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-yellow px-5 font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-70"
                    >
                      {isCompressing || isUploadPending ? (
                        <IconLoader size={14} className="animate-spin" />
                      ) : (
                        <IconPlus size={14} strokeWidth={3} />
                      )}
                      Add photo
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    'h-full min-h-0 w-full flex-1 border-2 border-tok-black',
                    layer.orientation === 'landscape'
                      ? 'bg-linear-to-br from-tok-cream/50 via-tok-teal/15 to-tok-black/10'
                      : 'bg-linear-to-b from-tok-cream/40 to-tok-black/8',
                  )}
                >
                  <div className="flex h-full w-full items-center justify-center opacity-30">
                    <IconCamera
                      size={layer.orientation === 'landscape' ? 40 : 32}
                      strokeWidth={2}
                      className="text-tok-black"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center gap-6">
        <button
          type="button"
          disabled
          tabIndex={-1}
          aria-hidden
          className="flex h-12 w-12 cursor-default items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black opacity-25 shadow-[4px_4px_0px_#1C1C1A]"
        >
          <IconChevronLeft size={28} strokeWidth={3} />
        </button>
        <div
          className="flex h-2 min-w-[32px] items-center justify-center rounded-full border border-tok-black/25 bg-tok-black/10 px-2"
          aria-label="No photos in roll"
        />
        <button
          type="button"
          disabled
          tabIndex={-1}
          aria-hidden
          className="flex h-12 w-12 cursor-default items-center justify-center rounded-sm border-[3px] border-tok-black bg-white text-tok-black opacity-25 shadow-[4px_4px_0px_#1C1C1A]"
        >
          <IconChevronRight size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function PhotoStackItem({
  dropId,
  photo,
  isTop,
  offset,
  direction,
  onSelect,
}: {
  dropId: string;
  photo: any;
  isTop: boolean;
  offset: number;
  direction: number;
  onSelect: () => void;
}) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const { data: detail } = usePhotoDetail(dropId, photo.id, {
    enabled: isTop && !photo.url,
  });

  const displaySrc = photo.url || detail?.base64 || '';
  const isLandscape = orientation === 'landscape';
  const isNext = direction >= 0;
  const baseRotate = offset === 0 ? 0 : offset % 2 === 0 ? 2.2 : -2.2;
  const enterX = isNext ? 145 : -115;
  const exitX = isNext ? -260 : 210;

  return (
    <motion.div
      layout="position"
      initial={{
        x: enterX,
        opacity: 0,
        scale: 0.96,
        rotate: isNext ? 6 : -4.5,
        y: offset * -8 + 10,
      }}
      animate={{
        scale: 1 - offset * 0.04,
        opacity: 1 - offset * 0.08,
        y: offset * -10,
        x: offset * 3,
        rotate: isTop ? 0 : baseRotate,
        zIndex: 10 - offset,
      }}
      whileHover={isTop ? {
        scale: 1.014,
        y: -12,
        rotate: 0,
        transition: { type: 'spring', stiffness: 360, damping: 24, mass: 0.75 }
      } : {}}
      exit={{
        x: exitX,
        opacity: 0,
        rotate: isNext ? -11 : 7,
        scale: 0.95,
        transition: {
          duration: isNext ? 0.34 : 0.26,
          ease: isNext ? [0.19, 1, 0.22, 1] : [0.22, 1, 0.36, 1],
        },
      }}
      transition={{
        x: { type: 'spring', stiffness: isNext ? 175 : 230, damping: isNext ? 24 : 27, mass: isNext ? 1.05 : 0.9 },
        y: { type: 'spring', stiffness: isNext ? 165 : 220, damping: isNext ? 22 : 25, mass: isNext ? 1.05 : 0.9 },
        scale: { type: 'spring', stiffness: isNext ? 185 : 240, damping: isNext ? 23 : 25, mass: isNext ? 1 : 0.85 },
        rotate: { type: 'spring', stiffness: isNext ? 155 : 205, damping: isNext ? 20 : 23, mass: isNext ? 1.05 : 0.9 },
        opacity: { duration: isNext ? 0.28 : 0.2, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={() => isTop && displaySrc && onSelect()}
      style={{
        width: isLandscape ? 'min(440px, 95vw)' : 'min(280px, 75vw)',
        height: isLandscape ? 'min(340px, 80vw)' : 'min(360px, 90vw)',
      }}
      className={cn(
        "absolute cursor-pointer rounded-sm border-[4px] border-tok-black bg-white p-3 shadow-[8px_8px_0px_#1C1C1A] transition-all",
        isLandscape ? "pb-14" : "pb-16",
        !isTop && "pointer-events-none"
      )}
    >
      <div className="relative h-full w-full overflow-hidden border-2 border-tok-black bg-tok-black/5">
        <AnimatePresence mode="wait">
          {!displaySrc ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full w-full items-center justify-center bg-tok-black/5"
            >
              <Skeleton className="h-full w-full bg-tok-black/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <IconLoader className="animate-spin text-tok-black/20" size={32} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative h-full w-full"
            >
              <NextImage
                src={displaySrc}
                alt="Drop moment"
                fill
                className="object-cover transition-all duration-700"
                sizes="(max-width: 640px) 90vw, (max-width: 768px) 440px, 440px"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > img.naturalHeight) {
                    setOrientation('landscape');
                  } else {
                    setOrientation('portrait');
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Badge only */}
        {photo.isFeatured && (
          <div className="absolute right-2 top-2 z-10">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-tok-black bg-tok-yellow shadow-[2px_2px_0px_#1C1C1A]">
              <IconStar size={14} className="fill-tok-black text-tok-black" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      {/* Polaroid bottom area */}
      <div className={cn(
        "absolute inset-x-3 bottom-0 flex items-center justify-between px-1",
        isLandscape ? "h-14" : "h-16"
      )}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal-pale">
            {photo.user?.avatar ? (
              <NextImage src={photo.user.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
            ) : (
              <span className="font-passion text-[9px] font-bold text-tok-teal">
                {(photo.user?.firstName?.[0] || '') + (photo.user?.lastName?.[0] || '')}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="font-passion text-sm font-bold uppercase tracking-tight text-tok-black leading-none">
              {photo.user?.firstName} {photo.user?.lastName}
            </p>
            <p className="mt-1 font-passion text-xs font-bold uppercase tracking-widest text-tok-black/50 leading-none">
              {new Date(photo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PhotoViewerModal({
  dropId,
  photoId,
  onClose,
  isOrganiser,
  userId,
  onFeature,
  onDelete,
  isFeaturePending
}: {
  dropId: string;
  photoId: string;
  onClose: () => void;
  isOrganiser: boolean;
  userId?: string;
  onFeature: () => void;
  onDelete: () => void;
  isFeaturePending: boolean;
}) {
  const { data: photo, isLoading } = usePhotoDetail(dropId, photoId);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [aspectRatio, setAspectRatio] = useState(1);

  const isLandscape = orientation === 'landscape';

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <div
          className="relative mx-auto rounded-sm border-[4px] border-tok-black bg-white p-4 pb-6 shadow-[12px_12px_0px_#1C1C1A] transition-all"
          style={{
            maxWidth: '92vw',
            width: 'fit-content',
            minWidth: 'min(380px, 90vw)'
          }}
        >
          <button
            onClick={close}
            className="absolute right-2 top-2 z-50 flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[3px_3px_0px_#1C1C1A] transition-all hover:bg-tok-black/5 active:translate-y-0 active:shadow-none"
          >
            <IconX size={18} strokeWidth={3} />
          </button>

          <div className="flex flex-col items-center">
            {isLoading || !photo ? (
              <div className="flex h-[300px] w-[300px] items-center justify-center text-tok-black/10">
                <Skeleton className="h-full w-full bg-tok-black/5" />
                <IconLoader className="absolute animate-spin text-tok-black/20" size={48} />
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden border-2 border-tok-black bg-tok-black/5 w-fit mt-8 min-h-[200px] min-w-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={photo.url || photo.base64}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <NextImage
                        src={photo.url || photo.base64 || ''}
                        alt="Full moment"
                        width={1200}
                        height={1200}
                        priority
                        className="h-auto w-auto object-contain max-h-[min(65vh,calc(100vh-220px))] max-w-[min(1000px,85vw)] transition-all duration-500"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const ratio = img.naturalWidth / img.naturalHeight;
                          setAspectRatio(ratio);
                          if (ratio > 1) setOrientation('landscape');
                          else setOrientation('portrait');
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className={cn(
                  "mt-4 flex items-center justify-between gap-4 w-full",
                  isLandscape ? "min-h-12" : "min-h-16"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal-pale font-passion text-sm font-bold text-tok-teal shadow-[2px_2px_0px_#1C1C1A]">
                      {photo.user.avatar ? (
                        <NextImage src={photo.user.avatar} alt="" width={48} height={48} className="h-full w-full object-cover" />
                      ) : (
                        (photo.user.firstName?.[0] || '') + (photo.user.lastName?.[0] || '')
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-passion text-xl md:text-2xl font-bold uppercase tracking-tight text-tok-black leading-none truncate">
                        {photo.user.firstName} {photo.user.lastName}
                      </p>
                      <p className="mt-1.5 font-passion text-[11px] md:text-xs font-bold uppercase tracking-[2px] text-tok-black/50 leading-none">
                        {new Date(photo.createdAt).toLocaleDateString()} @ {new Date(photo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {(isOrganiser || photo.isFeatured) && (
                      <button
                        onClick={(e) => {
                          if (!isOrganiser) return;
                          e.stopPropagation();
                          onFeature();
                        }}
                        disabled={isFeaturePending || !isOrganiser}
                        className={cn(
                          "flex h-10 md:h-12 gap-2 items-center justify-center rounded-sm border-2 border-tok-black px-3 md:px-4 font-passion text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#1C1C1A] md:shadow-[4px_4px_0px_#1C1C1A] transition-all disabled:opacity-100",
                          photo.isFeatured ? "bg-tok-yellow text-tok-black" : "bg-white text-tok-black",
                          isOrganiser && "hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
                        )}
                      >
                        {isFeaturePending ? (
                          <IconLoader size={14} className="animate-spin" />
                        ) : (
                          <>
                            <IconStar
                              strokeWidth={2.5}
                              className={cn(
                                "h-4 w-4 md:h-[18px] md:w-[18px]",
                                photo.isFeatured ? "fill-tok-black text-tok-black" : "text-tok-black"
                              )}
                            />
                          </>
                        )}
                      </button>
                    )}

                    {(photo.userId === userId || isOrganiser) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          onClose();
                        }}
                        className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-sm border-2 border-tok-black bg-red-500 text-white shadow-[3px_3px_0px_#1C1C1A] md:shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
                        title="Delete Photo"
                      >
                        <IconTrash strokeWidth={2.5} className="h-[18px] w-[18px] md:h-5 md:w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export function PhotoRollSkeleton() {
  return (
    <div className="mb-10 space-y-4">
      <div className="relative flex flex-col items-center pt-4 pb-8">
        <div className="relative flex h-[320px] w-[320px] items-center justify-center md:h-[400px] md:w-[400px]">
          {/* Stack effect */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-sm border-[4px] border-tok-black bg-white p-3 shadow-[8px_8px_0px_#1C1C1A]"
              style={{
                width: 'min(280px, 75vw)',
                height: 'min(360px, 90vw)',
                zIndex: 10 - i,
                transform: `rotate(${i === 0 ? 0 : (i % 2 === 0 ? 3 : -3)}deg) translate(${i * 4}px, ${i * -12}px)`,
                opacity: 1 - i * 0.2
              }}
            >
              <Skeleton className="h-full w-full bg-tok-black/5" />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Skeleton className="h-12 w-12 shrink-0 rounded-sm border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A]" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-2 w-2 rounded-full bg-tok-black/10" />
              ))}
            </div>
            <Skeleton className="h-12 w-12 shrink-0 rounded-sm border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A]" />
          </div>
          <span className="hidden h-8 w-[3px] shrink-0 rounded-full bg-tok-black/10 sm:block" aria-hidden />
          <Skeleton className="h-12 w-12 shrink-0 rounded-sm border-[3px] border-tok-black bg-tok-yellow/40 shadow-[4px_4px_0px_#1C1C1A] sm:w-24" />
        </div>
      </div>
    </div>
  );
}
