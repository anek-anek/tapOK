'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  X as IconX,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Lock as IconLock,
  Users as IconUsers,
  ChevronDown as IconChevronDown,
  ImagePlus as IconImagePlus,
  Trash2 as IconTrash,
} from 'lucide-react';
import {
  useCreateDrop,
  useUpdateDrop,
  useUploadCoverPhoto,
  useDeleteCoverPhoto,
} from '@/hooks/mutations/use-drop-mutations';
import { ALLOWED_COVER_PHOTO_TYPES, MAX_COVER_PHOTO_SIZE } from '@/lib/supabase-storage';
import { toast } from 'react-hot-toast';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ModalShell } from '@/components/modal-shell';
import type { Drop } from '@/types/drop';
import { cn } from '@/lib/utils';

const DROP_DEFAULT_COVER_PATH: Record<'hangout' | 'party', string> = {
  hangout: '/tapok-hangout.png',
  party: '/tapok-party.png',
};

const expectedHeadcountSchema = z.coerce
  .number()
  .int()
  .min(1)
  .optional()
  .or(z.literal(''));

const dropFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  location: z.string().min(1, 'Location is required'),
  expectedHeadcount: expectedHeadcountSchema,
  isLocked: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  category: z.enum(['hangout', 'party']).optional().nullable(),
  minimumAge: z.union([z.number().int().min(1).max(99), z.null()]).optional(),
  overview: z.string().optional(),
});

const createSchema = dropFormSchema;
const editSchema = dropFormSchema.partial({
  name: true,
  scheduledAt: true,
  location: true,
  expectedHeadcount: true,
});

type FormValues = {
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount: number | '' | undefined;
  isLocked?: boolean;
  isPublic?: boolean;
  category?: 'hangout' | 'party';
  minimumAge?: number | null;
  overview?: string;
};

const COMPLETE_TIME_PATTERN = /^\d{1,2}:\d{2}$/;

function formatPreviewDate(iso: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) +
      ' · ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return null;
  }
}

/** Parses an ISO/datetime-local string into { time12, period } using local time */
function isoToTimeParts(iso: string): { time12: string; period: 'AM' | 'PM' } {
  if (!iso) return { time12: '', period: 'AM' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { time12: '', period: 'AM' };

  const h24 = d.getHours();
  const m = d.getMinutes();
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = String(m).padStart(2, '0');

  return { time12: `${h12}:${mStr}`, period };
}

/** Parses a 12-hour "H:mm" string + period into a 24-hour "HH:mm" string */
function time12To24(time12: string, period: 'AM' | 'PM'): string {
  const [hStr, mStr] = (time12 || '12:00').split(':');
  let h = parseInt(hStr ?? '12', 10) % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${(mStr ?? '00').padStart(2, '0')}`;
}

/** Merges a Date and a "HH:mm" 24-hour string into a datetime-local string "YYYY-MM-DDTHH:mm" */
function mergeDateAndTime(date: Date | undefined, time24: string): string {
  const baseDate = date || new Date();
  const dateStr = format(baseDate, 'yyyy-MM-dd');
  return `${dateStr}T${time24}`;
}

function toIsoString(value: string): string {
  return new Date(value).toISOString();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeExpectedHeadcount(value: FormValues['expectedHeadcount']) {
  return value ? Number(value) : undefined;
}

function getUpdatedExpectedHeadcount(
  value: FormValues['expectedHeadcount'],
  currentValue?: number | null,
) {
  if (value === '') {
    return currentValue === undefined ? undefined : null;
  }

  return normalizeExpectedHeadcount(value);
}

/** Shared date + time picker that writes a datetime-local string via onChange */
function DateTimePicker({
  value,
  onChange,
  error,
  id,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;
  const { time12, period } = isoToTimeParts(value);

  // Local draft so the user can type freely; we only commit valid "h:mm" values
  const [draft, setDraft] = useState(time12);
  useEffect(() => {
    setDraft(time12);
  }, [time12]);

  const commitDateTime = (time24: string) => {
    onChange(mergeDateAndTime(selectedDate, time24));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setOpen(false);
    onChange(mergeDateAndTime(date, time12To24(time12, period)));
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Only allow numbers and colon
    raw = raw.replace(/[^\d:]/g, '');

    // Basic format restriction: H:mm or HH:mm
    const parts = raw.split(':');

    // Don't allow more than one colon
    if (parts.length > 2) return;

    // Validate hours part (should be 1-12)
    if (parts[0]) {
      const h = parseInt(parts[0] ?? '', 10);
      if (h > 12) return;
    }

    // Validate minutes part (should be 0-59)
    if (parts[1]) {
      const m = parseInt(parts[1] ?? '', 10);
      if (m > 59) return;
      if (parts[1].length > 2) return;
    }

    setDraft(raw);

    // Commit only when it looks like a complete and valid "h:mm" or "hh:mm"
    if (COMPLETE_TIME_PATTERN.test(raw)) {
      const h = parseInt(parts[0] ?? '', 10);
      if (h >= 1 && h <= 12) {
        commitDateTime(time12To24(raw, period));
      }
    }
  };

  const handleTimeBlur = () => {
    // On blur, normalise or clear the draft
    if (COMPLETE_TIME_PATTERN.test(draft)) {
      const normalised = time12To24(draft, period);
      const nextValue = mergeDateAndTime(selectedDate, normalised);
      onChange(nextValue);
      setDraft(isoToTimeParts(nextValue).time12);
    } else {
      // Revert to last committed value
      setDraft(time12);
    }
  };

  const togglePeriod = (p: 'AM' | 'PM') => {
    commitDateTime(time12To24(time12, p));
  };

  return (
    <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,186px)] sm:items-end sm:gap-2.5">
      <Field className="w-full sm:min-w-0 sm:flex-1">
        <FieldLabel
          htmlFor={`${id}-date`}
          className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
        >
          Date
        </FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={`${id}-date`}
            className="flex h-12 w-full items-center justify-between rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-base font-bold tracking-wide text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none focus-visible:outline-none"
          >
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : <span className="text-tok-black/15">Pick date</span>}
            <IconChevronDown size={16} className="text-tok-black/40" strokeWidth={2.5} />
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-sm border-[3px] border-tok-black bg-white p-0 shadow-[6px_6px_0px_#1C1C1A]" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              defaultMonth={selectedDate}
              onSelect={handleDateSelect}
              startMonth={new Date()}
              endMonth={new Date(new Date().getFullYear() + 10, 11)}
            />
          </PopoverContent>
        </Popover>
      </Field>

      <div className="flex min-w-0 items-end gap-2">
        {/* 12-hour time input */}
        <Field className="min-w-0 flex-1 sm:w-[94px] sm:flex-none">
          <FieldLabel
            htmlFor={`${id}-time`}
            className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
          >
            Time
          </FieldLabel>
          <Input
            type="text"
            id={`${id}-time`}
            value={draft}
            onChange={handleTimeInput}
            onBlur={handleTimeBlur}
            placeholder="h:mm"
            className="h-12 rounded-sm border-[3px] border-tok-black bg-white px-3 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </Field>

        {/* AM/PM toggle */}
        <Field className="w-20 shrink-0">
          <div className="flex h-12 min-w-0 items-stretch overflow-hidden rounded-sm border-[3px] border-tok-black bg-white">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePeriod(p)}
                className={`flex-1 font-passion text-xs font-bold tracking-[1px] transition-all ${period === p
                  ? 'bg-tok-teal text-tok-cream'
                  : 'text-tok-black/40 hover:bg-tok-black/5'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </FieldGroup>
  );
}

export function DropModal({
  drop,
  onClose,
  onSuccess,
}: {
  drop?: Drop;
  onClose: () => void;
  onSuccess?: (drop: Drop) => void;
}) {
  const isEdit = !!drop;
  const router = useRouter();
  const createDrop = useCreateDrop();
  const updateDrop = useUpdateDrop(drop?.id ?? '');
  const uploadCoverPhoto = useUploadCoverPhoto(drop?.id ?? '');
  const deleteCoverPhoto = useDeleteCoverPhoto(drop?.id ?? '');
  const pendingIdRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(drop?.coverPhoto ?? null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_COVER_PHOTO_TYPES.includes(file.type)) {
      setCoverError('Only JPG and PNG files are supported');
      return;
    }
    if (file.size > MAX_COVER_PHOTO_SIZE) {
      setCoverError('File must be under 5 MB');
      return;
    }
    setCoverError(null);
    setPendingCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCoverRemove = async () => {
    if (isEdit && drop?.coverPhoto && !pendingCoverFile) {
      try {
        await deleteCoverPhoto.mutateAsync();
      } catch {
        toast.error('FAILED TO DELETE COVER PHOTO');
        return;
      }
    }
    setPendingCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const isBusyRef = useRef(false);

  const wrappedClose = useCallback((force = false) => {
    // If force is true, we ignore isBusy (used for programmatic close after success)
    if (force !== true && isBusyRef.current) return;
    onClose();
    if (pendingIdRef.current && !isEdit) {
      router.push(`/drops/${pendingIdRef.current}`);
    }
  }, [onClose, router, isEdit]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    values: {
      name: drop?.name ?? '',
      scheduledAt: drop?.scheduledAt ? new Date(drop.scheduledAt).toISOString() : '',
      location: drop?.location ?? '',
      expectedHeadcount: drop?.expectedHeadcount ?? '',
      isLocked: drop?.isLocked ?? false,
      isPublic: drop?.isPublic ?? true,
      category: drop?.category ?? undefined,
      minimumAge: drop?.minimumAge ?? null,
      overview: drop?.overview ?? '',
    },
  });

  const [name, scheduledAt, location, overview, category] = watch([
    'name',
    'scheduledAt',
    'location',
    'overview',
    'category',
  ]);

  useEffect(() => {
    if (isEdit || pendingCoverFile) return;
    if (category === 'hangout') {
      setCoverPreview(DROP_DEFAULT_COVER_PATH.hangout);
    } else if (category === 'party') {
      setCoverPreview(DROP_DEFAULT_COVER_PATH.party);
    } else {
      setCoverPreview(null);
    }
  }, [category, isEdit, pendingCoverFile]);

  useEffect(() => {
    if (category !== 'party') {
      setValue('minimumAge', null);
    }
  }, [category, setValue]);

  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  const isBusy = createDrop.isPending || updateDrop.isPending || uploadCoverPhoto.isPending || deleteCoverPhoto.isPending || isSubmitting || isSubmittingInternal;
  isBusyRef.current = isBusy;
  const onSubmit = handleSubmit(async (values) => {
    if (isSubmittingInternal) return;
    setIsSubmittingInternal(true);

    try {
      const scheduledAtIso = values.scheduledAt ? toIsoString(values.scheduledAt) : undefined;
      const expectedHeadcount = normalizeExpectedHeadcount(values.expectedHeadcount);

      if (isEdit && drop) {
        const dto: Parameters<typeof updateDrop.mutateAsync>[0] = {};
        if (values.name !== drop.name) dto.name = values.name;
        if (scheduledAtIso && scheduledAtIso !== drop.scheduledAt) dto.scheduledAt = scheduledAtIso;
        if (values.location !== drop.location) dto.location = values.location;
        const updatedExpectedHeadcount = getUpdatedExpectedHeadcount(
          values.expectedHeadcount,
          drop.expectedHeadcount,
        );
        if (updatedExpectedHeadcount !== undefined && updatedExpectedHeadcount !== drop.expectedHeadcount) {
          dto.expectedHeadcount = updatedExpectedHeadcount;
        }
        if (values.isLocked !== drop.isLocked) dto.isLocked = values.isLocked;
        if (values.isPublic !== drop.isPublic) dto.isPublic = values.isPublic;
        if (values.category !== drop.category) dto.category = values.category ?? undefined;
        if (values.overview !== drop.overview) dto.overview = values.overview;
        const effectiveMinAge = values.category === 'party' ? values.minimumAge ?? null : null;
        if (effectiveMinAge !== (drop.minimumAge ?? null)) {
          dto.minimumAge = effectiveMinAge;
        }

        if (Object.keys(dto).length > 0) {
          try {
            await updateDrop.mutateAsync(dto);
          } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
              toast.error((t) => (
                <div className="flex flex-col gap-3">
                  <p className="font-passion text-xs font-bold uppercase tracking-wider">{err.response?.data?.message}</p>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      router.push('/profile?verify=true');
                    }}
                    className="rounded-sm border-2 border-white bg-white px-3 py-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black transition-all hover:bg-white/90"
                  >
                    Go to Profile
                  </button>
                </div>
              ), { duration: 6000 });
            } else {
              const msg = err instanceof Error ? err.message : 'FAILED TO UPDATE DROP';
              toast.error(String(msg).toUpperCase());
            }
            return;
          }
        }

        if (pendingCoverFile && drop?.id) {
          try {
            await uploadCoverPhoto.mutateAsync(pendingCoverFile);
          } catch {
            toast.error('DROP UPDATED BUT COVER PHOTO UPLOAD FAILED — PLEASE RETRY');
            wrappedClose(true);
            return;
          }
        }

        toast.success('DROP UPDATED SUCCESSFULLY');
        if (onSuccess) onSuccess({ ...drop, ...dto } as Drop);
        wrappedClose(true);
      } else {
        let coverPhotoBase64: string | undefined;
        if (pendingCoverFile) {
          try {
            coverPhotoBase64 = await readFileAsDataUrl(pendingCoverFile);
          } catch {
            toast.error('FAILED TO READ COVER PHOTO');
            return;
          }
        }

        const dto = {
          name: values.name,
          scheduledAt: scheduledAtIso ?? toIsoString(values.scheduledAt),
          location: values.location,
          expectedHeadcount,
          isLocked: values.isLocked ?? false,
          isPublic: values.isPublic ?? true,
          category: values.category ?? undefined,
          minimumAge: values.category === 'party' ? values.minimumAge ?? null : null,
          overview: values.overview,
          idempotencyKey: idempotencyKeyRef.current,
          ...(coverPhotoBase64 ? { coverPhotoBase64 } : {}),
        };

        let result: Drop;
        let createdId: string;
        try {
          result = await createDrop.mutateAsync(dto);
          createdId = result.id;
          pendingIdRef.current = createdId;
        } catch (err: any) {
          if (axios.isAxiosError(err) && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            toast.error((t) => (
              <div className="flex flex-col gap-3">
                <p className="font-passion text-xs font-bold uppercase tracking-wider">{err.response?.data?.message}</p>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push('/profile?verify=true');
                  }}
                  className="rounded-sm border-2 border-white bg-white px-3 py-1 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black transition-all hover:bg-white/90"
                >
                  Go to Profile
                </button>
              </div>
            ), { duration: 6000 });
          } else {
            const msg = err instanceof Error ? err.message : 'FAILED TO DEPLOY DROP';
            toast.error(String(msg).toUpperCase());
          }
          return;
        }

        toast.success('DROP DEPLOYED SUCCESSFULLY');
        if (onSuccess) onSuccess(result);
        wrappedClose(true);
      }
    } finally {
      isBusyRef.current = false;
      setIsSubmittingInternal(false);
    }
  });

  return (
    <ModalShell onClose={wrappedClose}>
      {(close) => {
        return (
          <div className="flex max-h-[inherit] min-w-0 flex-col overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[10px_10px_0px_#1C1C1A]">
            <div className="grid min-w-0 grid-cols-1 overflow-y-auto overflow-x-hidden sm:grid-cols-[minmax(160px,220px)_minmax(0,1fr)]">
              {/* Left panel — Header on mobile, sidebar on desktop */}
              <aside className="group relative flex min-w-0 flex-col justify-between overflow-hidden bg-tok-teal px-6 py-6 min-h-[140px] sm:min-h-0 sm:py-8 sm:flex">
                {/* Cover photo background */}
                {coverPreview && (
                  <div className="pointer-events-none absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverPreview} alt="" className="h-full w-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-tok-black/20" />
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleCoverSelect}
                />

                {/* Cover photo actions — Neubrutalist style, now always centered */}
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-4 transition-all sm:gap-3">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isBusy}
                    className="flex h-10 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-tok-cream px-4 font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
                  >
                    <IconImagePlus size={16} strokeWidth={2.5} />
                    <span>{coverPreview ? 'Change Cover' : 'Add Cover Photo'}</span>
                  </button>

                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => void handleCoverRemove()}
                      disabled={isBusy}
                      className="flex h-10 items-center gap-2 rounded-sm border-[3px] border-tok-black bg-[#ff5c5c] px-4 font-passion text-[11px] font-bold uppercase tracking-wider text-white shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
                    >
                      <IconTrash size={16} strokeWidth={2.5} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {coverError && (
                  <div className="absolute top-4 left-4 right-4 z-40">
                    <p className="rounded-sm border-2 border-tok-black bg-red-500 px-3 py-1.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white shadow-[4px_4px_0px_#1C1C1A]">
                      {coverError}
                    </p>
                  </div>
                )}

                {/* Panel content — desktop only for details */}
                <div className="relative z-20 hidden sm:block">
                  <p className="mb-3 font-passion text-[9px] font-bold uppercase tracking-[3.5px] text-tok-cream/50">
                    {isEdit ? 'DROP UPDATE' : 'INITIALIZING DROP'}
                  </p>
                  <div
                    className="font-passion leading-tight tracking-[1.2px] text-tok-cream"
                    style={{ fontSize: 'clamp(20px,2.5vw,28px)' }}
                  >
                    {name || <span className="text-tok-cream/30">{isEdit ? drop?.name : 'Untitled.'}</span>}
                  </div>
                </div>

                <div className="relative z-20 space-y-3 text-[11px] font-bold text-tok-cream/60 hidden sm:block">
                  {scheduledAt && (
                    <div className="flex items-center gap-2.5">
                      <IconCalendar size={12} className="text-amber-400" strokeWidth={2.5} />
                      <span className="font-passion uppercase tracking-wider">{formatPreviewDate(scheduledAt)}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-2.5">
                      <IconMapPin size={12} className="text-amber-400" strokeWidth={2.5} />
                      <span className="font-passion truncate uppercase tracking-wider">{location}</span>
                    </div>
                  )}
                  <div className="mt-6 border-t-2 border-dashed border-tok-cream/10 pt-6">
                    <p className="mb-1.5 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-cream/40">
                      JOIN TOKEN
                    </p>
                    <p className="font-passion text-xl font-bold tracking-[5px] text-tok-cream">
                      {isEdit ? drop?.joinCode : '------'}
                    </p>
                  </div>
                  {overview && (
                    <div className="mt-6 border-t-2 border-dashed border-tok-cream/10 pt-4">
                      <p className="mb-1.5 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-cream/40">
                        OVERVIEW
                      </p>
                      <p className="font-passion text-[11px] font-bold text-tok-cream/70 line-clamp-4">
                        {overview}
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Form panel */}
              <div className="flex min-w-0 flex-col overflow-x-hidden bg-tok-cream px-6 py-7 sm:px-8 sm:py-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-passion text-2xl font-bold leading-none tracking-tight text-tok-black sm:text-3xl">
                      {isEdit ? 'EDIT DROP.' : 'NEW DROP.'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    disabled={isBusy}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40"
                  >
                    <IconX size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drop-modal-name"
                      className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
                    >
                      Drop Name
                    </Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="drop-modal-name"
                          type="text"
                          placeholder="e.g. Rooftop Drinks"
                          autoFocus
                          className="h-12 rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="font-passion text-[10px] font-bold uppercase tracking-wider text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Controller
                      name="scheduledAt"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          id="drop-modal"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.scheduledAt?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drop-modal-location"
                      className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
                    >
                      Location
                    </Label>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="drop-modal-location"
                          type="text"
                          placeholder="e.g. Sunset Beach"
                          className="h-12 rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      )}
                    />
                    {errors.location && (
                      <p className="font-passion text-[10px] font-bold uppercase tracking-wider text-red-500">
                        {errors.location.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drop-modal-overview"
                      className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
                    >
                      Overview <span className="normal-case opacity-40 font-normal">— Optional</span>
                    </Label>
                    <Controller
                      name="overview"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          id="drop-modal-overview"
                          rows={3}
                          placeholder="e.g. Bring your own drinks and some snacks to share!"
                          className="w-full rounded-sm border-[3px] border-tok-black bg-white px-4 py-3 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drop-modal-headcount"
                      className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
                    >
                      Headcount <span className="normal-case opacity-40 font-normal">— Optional</span>
                    </Label>
                    <Controller
                      name="expectedHeadcount"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="drop-modal-headcount"
                          type="number"
                          min={1}
                          placeholder="e.g. 20"
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-12 rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40">
                      Category
                    </Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-2">
                          {(['hangout', 'party'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => field.onChange(field.value === cat ? undefined : cat)}
                              className={cn(
                                'h-11 flex-1 rounded-sm border-[3px] border-tok-black font-passion text-xs font-bold uppercase tracking-[1.5px] transition-all',
                                field.value === cat
                                  ? 'bg-tok-teal text-tok-cream shadow-none translate-y-0'
                                  : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]'
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    {category === 'party' && (
                      <div className="mt-3 space-y-2 border-t-2 border-dashed border-tok-black/20 pt-3">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="drop-modal-headcount"
                            className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40"
                          >
                            Age floor <span className="normal-case opacity-40 font-normal">— Optional</span>
                          </Label>
                        </div>
                        <Controller
                          name="minimumAge"
                          control={control}
                          render={({ field }) => {
                            const restricted = field.value != null;
                            return (
                              <div className="my-1 flex flex-wrap items-stretch gap-2">
                                <button
                                  type="button"
                                  onClick={() => field.onChange(restricted ? null : 20)}
                                  className={cn(
                                    'h-11 min-w-0 flex-1 rounded-sm border-[3px] border-tok-black px-2 font-passion text-[10px] font-bold uppercase tracking-[1px] transition-all sm:px-3 sm:text-xs',
                                    restricted
                                      ? 'bg-tok-black text-tok-cream shadow-none'
                                      : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]',
                                  )}
                                >
                                  {restricted ? 'Min age set' : 'Any age'}
                                </button>
                                {restricted && (
                                  <div className="flex min-w-0 items-center gap-1.5 rounded-sm border-[3px] border-tok-black bg-white px-2 py-0.5">
                                    <span className="font-passion text-sm font-bold text-tok-black/50" aria-hidden>
                                      ≥
                                    </span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={99}
                                      value={field.value ?? 20}
                                      onChange={(e) => {
                                        const n = Number.parseInt(e.target.value, 10);
                                        if (!Number.isFinite(n)) return;
                                        field.onChange(Math.min(99, Math.max(1, n)));
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                      className="h-6 w-11 min-w-0 border-0 bg-transparent p-0 text-center font-passion text-base font-bold text-tok-black shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      aria-label="Minimum age"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <Label className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40">
                        Security
                      </Label>
                      <Controller
                        name="isLocked"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`flex h-12 w-full items-center justify-between rounded-sm border-[3px] border-tok-black px-4 transition-all ${field.value ? 'bg-amber-400 text-tok-black shadow-none translate-y-0' : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <IconLock size={14} strokeWidth={2.5} />
                              <span className="font-passion font-bold uppercase tracking-wider text-sm">
                                {field.value ? 'Locked' : 'Open'}
                              </span>
                            </div>
                            <div
                              className={`h-3.5 w-3.5 rounded-full border-2 border-tok-black ${field.value ? 'bg-tok-black' : 'bg-white'
                                }`}
                            />
                          </button>
                        )}
                      />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <Label className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] sm:tracking-[2.5px] text-tok-black/40">
                        Visibility
                      </Label>
                      <Controller
                        name="isPublic"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`flex h-12 w-full items-center justify-between rounded-sm border-[3px] border-tok-black px-4 transition-all ${!field.value ? 'bg-tok-black text-white shadow-none translate-y-0' : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {!field.value ? (
                                <IconLock size={14} strokeWidth={2.5} />
                              ) : (
                                <IconUsers size={14} strokeWidth={2.5} />
                              )}
                              <span className="font-passion font-bold uppercase tracking-wider text-sm">
                                {field.value ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <div
                              className={`h-3.5 w-3.5 rounded-full border-2 ${field.value ? 'bg-white border-tok-black' : 'bg-tok-teal border-white'
                                }`}
                            />
                          </button>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={close}
                      disabled={isBusy}
                      className="h-14 min-h-14 flex-1 rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-sm font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40 sm:h-11 sm:min-h-11 sm:px-8 sm:text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="flex h-14 min-h-14 flex-1 items-center justify-center gap-2.5 rounded-sm border-[3px] border-tok-black bg-tok-teal px-4 font-passion text-base font-bold uppercase tracking-[2px] text-tok-cream transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50 sm:h-11 sm:min-h-11 sm:px-10 sm:text-sm"
                    >
                      {isBusy ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-tok-cream/30 border-t-tok-cream" />
                          <span className="text-sm">...</span>
                        </>
                      ) : (
                        <span className="text-nowrap">{isEdit ? 'Save Drop' : 'Deploy Drop'}</span>
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        );
      }}
    </ModalShell>
  );
}
