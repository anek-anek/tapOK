'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  X as IconX,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Lock as IconLock,
  ChevronDown as IconChevronDown,
} from 'lucide-react';
import {
  useCreateDrop,
  useUpdateDrop,
} from '@/hooks/mutations/use-drop-mutations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
    <FieldGroup className="flex flex-row items-end gap-2.5">
      <Field className="min-w-0 flex-1">
        <FieldLabel
          htmlFor={`${id}-date`}
          className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40"
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
            />
          </PopoverContent>
        </Popover>
      </Field>

      {/* 12-hour time input */}
      <Field className="w-24 shrink-0">
        <FieldLabel
          htmlFor={`${id}-time`}
          className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40"
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
        <div className="flex h-12 items-stretch overflow-hidden rounded-sm border-[3px] border-tok-black bg-white">
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePeriod(p)}
              className={`flex-1 font-passion text-xs font-bold tracking-[1px] transition-all ${period === p
                ? 'bg-tok-teal text-[#F7E9B2]'
                : 'text-tok-black/40 hover:bg-tok-black/5'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>
    </FieldGroup>
  );
}

export function DropModal({ drop, onClose }: { drop?: Drop; onClose: () => void }) {
  const isEdit = !!drop;
  const router = useRouter();
  const createDrop = useCreateDrop();
  const updateDrop = useUpdateDrop(drop?.id ?? '');
  const pendingIdRef = useRef<string | null>(null);

  const wrappedClose = useCallback(() => {
    onClose();
    if (pendingIdRef.current && !isEdit) {
      router.push(`/drops/${pendingIdRef.current}`);
    }
  }, [onClose, router, isEdit]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    values: {
      name: drop?.name ?? '',
      scheduledAt: drop?.scheduledAt ? new Date(drop.scheduledAt).toISOString() : '',
      location: drop?.location ?? '',
      expectedHeadcount: drop?.expectedHeadcount ?? '',
      isLocked: drop?.isLocked ?? false,
    },
  });

  const [name, scheduledAt, location] = watch([
    'name',
    'scheduledAt',
    'location',
  ]);

  const isPending = createDrop.isPending || updateDrop.isPending;
  const serverError = createDrop.error || updateDrop.error;

  return (
    <ModalShell onClose={wrappedClose}>
      {(close) => {
        const onSubmit = handleSubmit(async (values) => {
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

            if (Object.keys(dto).length > 0) {
              await updateDrop.mutateAsync(dto);
            }
            close();
          } else {
            const dto = {
              name: values.name,
              scheduledAt: scheduledAtIso ?? toIsoString(values.scheduledAt),
              location: values.location,
              expectedHeadcount,
              isLocked: values.isLocked ?? false,
            };
            const result = await createDrop.mutateAsync(dto);
            pendingIdRef.current = result.id;
            close();
          }
        });

        return (
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border-[3px] border-tok-black bg-white shadow-[10px_10px_0px_#1C1C1A] sm:grid-cols-[220px_1fr]">
            {/* Dark left panel — desktop only */}
            <aside className="hidden flex-col justify-between bg-tok-teal px-6 py-8 sm:flex">
              <div>
                <p className="mb-3 font-passion text-[9px] font-bold uppercase tracking-[3.5px] text-[#F7E9B2]/50">
                  {isEdit ? 'DROP UPDATE' : 'INITIALIZING DROP'}
                </p>
                <div
                  className="font-passion leading-tight tracking-[1.2px] text-[#F7E9B2]"
                  style={{ fontSize: 'clamp(20px,2.5vw,28px)' }}
                >
                  {name || <span className="text-[#F7E9B2]/30">{isEdit ? drop?.name : 'Untitled.'}</span>}
                </div>
              </div>

              <div className="space-y-3 text-[11px] font-bold text-[#F7E9B2]/60">
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
                <div className="mt-6 border-t-2 border-dashed border-[#F7E9B2]/10 pt-6">
                  <p className="mb-1.5 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#F7E9B2]/40">
                    JOIN TOKEN
                  </p>
                  <p className="font-passion text-xl font-bold tracking-[5px] text-[#F7E9B2]">
                    {isEdit ? drop?.joinCode : '------'}
                  </p>
                </div>
              </div>
            </aside>

            {/* Form panel */}
            <div className="flex flex-col bg-[#FFF4BD] px-6 py-7 sm:px-8 sm:py-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="mb-1 font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                    {isEdit ? 'SYSTEM: UPDATE' : 'SYSTEM: CREATE'}
                  </p>
                  <h2 className="font-passion text-3xl font-bold leading-none tracking-tight text-tok-black">
                    {isEdit ? 'EDIT DROP.' : 'NEW DROP.'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
                >
                  <IconX size={18} strokeWidth={2.5} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="drop-modal-name"
                    className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40"
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
                    className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40"
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drop-modal-headcount"
                      className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40"
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
                          className="h-12 rounded-sm border-[3px] border-tok-black bg-white px-4 font-passion text-base font-bold tracking-wide text-tok-black placeholder:text-tok-black/15 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/40">
                      Security
                    </Label>
                    <Controller
                      name="isLocked"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`flex h-12 w-full items-center justify-between rounded-sm border-[3px] border-tok-black px-4 transition-all ${
                            field.value ? 'bg-amber-400 text-tok-black shadow-none translate-y-0' : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <IconLock size={14} strokeWidth={2.5} />
                            <span className="font-passion font-bold uppercase tracking-wider text-sm">
                              {field.value ? 'Locked' : 'Open'}
                            </span>
                          </div>
                          <div
                            className={`h-3.5 w-3.5 rounded-full border-2 border-tok-black ${
                              field.value ? 'bg-tok-black' : 'bg-white'
                            }`}
                          />
                        </button>
                      )}
                    />
                  </div>
                </div>

                {serverError && (
                  <div className="rounded-sm border-[3px] border-red-500 bg-red-50 p-3">
                    <p className="font-passion text-[10px] font-bold uppercase tracking-wider text-red-600">
                      {serverError.message || `ERROR: Failed to ${isEdit ? 'update' : 'create'} drop.`}
                    </p>
                  </div>
                )}

                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="h-11 rounded-sm border-[3px] border-tok-black bg-white px-6 font-passion text-xs font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-11 items-center justify-center gap-2.5 rounded-sm border-[3px] border-tok-black bg-tok-teal px-8 font-passion text-base font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#F7E9B2]/30 border-t-[#F7E9B2]" />
                        <span className="text-sm">Processing...</span>
                      </>
                    ) : (
                      <span>{isEdit ? 'Save Drop' : 'Deploy Drop'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      }}
    </ModalShell>
  );
}
