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
    <FieldGroup className="flex-row gap-2">
      <Field className="min-w-0 flex-1">
        <FieldLabel
          htmlFor={`${id}-date`}
          className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
        >
          Date
        </FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={`${id}-date`}
            className="flex h-auto w-full items-center justify-between rounded-[8px] border border-[#2a2118]/9 bg-white/75 px-3 py-3 text-sm font-normal text-[#2a2118] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tok-teal/20"
          >
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : <span className="text-[#2a2118]/30">Pick date</span>}
            <IconChevronDown size={13} className="text-[#2a2118]/36" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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
          className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
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
          className="h-auto rounded-[8px] border-[#2a2118]/9 bg-white/75 px-3 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/25 focus-visible:border-tok-teal/45 focus-visible:ring-tok-teal/15"
        />
      </Field>

      {/* AM/PM toggle */}
      <Field className="w-16 shrink-0">
        <FieldLabel className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
          &nbsp;
        </FieldLabel>
        <div className="flex h-full items-stretch overflow-hidden rounded-[8px] border border-[#2a2118]/9 bg-white/75">
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePeriod(p)}
              className={`flex-1 font-passion text-[10px] font-bold tracking-[1px] transition-colors ${period === p
                ? 'bg-tok-teal text-[#F7E9B2]'
                : 'text-[#2a2118]/40 hover:text-[#2a2118]/70'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      {error && (
        <p className="col-span-2 font-passion text-[10px] text-red-500/80">{error}</p>
      )}
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
          <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
            {/* Dark left panel — desktop only */}
            <aside className="hidden sm:flex sm:flex-col sm:justify-between bg-tok-teal px-7 pt-8 pb-8">
              <div>
                <p className="font-passion text-[8px] font-bold tracking-[3px] uppercase text-[#F7E9B2]/50 mb-4">
                  {isEdit ? 'Editing' : 'Creating'}
                </p>
                <div
                  className="font-passion tracking-[1.5px] text-[#F7E9B2] leading-tight mb-3"
                  style={{ fontSize: 'clamp(22px,2.8vw,30px)' }}
                >
                  {name || <span className="text-[#F7E9B2]/30">{isEdit ? drop?.name : 'New Drop'}</span>}
                </div>
              </div>

              <div className="space-y-2.5 text-[11px] font-light text-[#F7E9B2]/50">
                {scheduledAt && (
                  <div className="flex items-center gap-2">
                    <IconCalendar size={10} className="opacity-70 shrink-0" />
                    <span>{formatPreviewDate(scheduledAt)}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <IconMapPin size={10} className="opacity-70 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
                <div className="mt-5 pt-5 border-t border-[#F7E9B2]/10">
                  <p className="font-passion text-[8px] font-bold tracking-[2.5px] uppercase text-[#F7E9B2]/35 mb-1.5">
                    Join Code
                  </p>
                  <p className="font-passion text-[15px] font-bold tracking-[5px] text-[#F7E9B2]/30">
                    {isEdit ? drop?.joinCode : '------'}
                  </p>
                </div>
              </div>
            </aside>

            {/* Form panel */}
            <div className="flex flex-col bg-[#F7E9B2] px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-1 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                    {isEdit ? 'Edit' : 'Create'}
                  </p>
                  <div className="font-passion text-[32px] leading-none tracking-[2px] text-[#2a2118]">
                    {isEdit ? 'Update Drop.' : 'New Drop.'}
                  </div>
                  <p className="mt-1.5 text-[12px] font-light text-[#2a2118]/44">
                    {isEdit ? 'Update what needs changing.' : 'Fill in the details and drop it.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={close}
                  className="mt-0.5 shrink-0 rounded-full border-[#2a2118]/12 bg-transparent text-[#2a2118]/36 hover:border-[#2a2118]/22 hover:bg-white/50 hover:text-[#2a2118]"
                >
                  <IconX size={14} />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
                <div>
                  <Label
                    htmlFor="drop-modal-name"
                    className="mb-2 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
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
                        aria-invalid={Boolean(errors.name)}
                        className="h-auto rounded-[8px] border-[#2a2118]/9 bg-white/75 px-4 py-3 text-[15px] font-semibold text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-tok-teal/45 focus-visible:ring-tok-teal/15"
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 font-passion text-[10px] text-red-500/80">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
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

                <div>
                  <Label
                    htmlFor="drop-modal-location"
                    className="mb-2 flex items-center gap-1.5 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
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
                        aria-invalid={Boolean(errors.location)}
                        className="h-auto rounded-[8px] border-[#2a2118]/9 bg-white/75 px-3 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-tok-teal/45 focus-visible:ring-tok-teal/15"
                      />
                    )}
                  />
                  {errors.location && (
                    <p className="mt-1.5 font-passion text-[10px] text-red-500/80">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="drop-modal-headcount"
                    className="mb-2 flex items-center gap-1.5 font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
                  >
                    Headcount
                    <span className="font-normal normal-case tracking-normal text-[#2a2118]/22">
                      — optional
                    </span>
                  </Label>
                  <Controller
                    name="expectedHeadcount"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Input
                          {...field}
                          id="drop-modal-headcount"
                          type="number"
                          min={1}
                          placeholder="e.g. 20"
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-auto rounded-[8px] border-[#2a2118]/9 bg-white/75 px-4 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-tok-teal/45 focus-visible:ring-tok-teal/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        {errors.expectedHeadcount && (
                          <p className="mt-1.5 font-passion text-[10px] text-red-500/80">
                            {errors.expectedHeadcount.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <Controller
                  name="isLocked"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`flex w-full items-center justify-between rounded-[10px] border px-4 py-3 transition-colors ${field.value
                        ? 'border-amber-400/40 bg-amber-50/80'
                        : 'border-[#2a2118]/9 bg-white/75 hover:border-[#2a2118]/18'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconLock
                          size={13}
                          className={field.value ? 'text-amber-700' : 'text-[#2a2118]/30'}
                        />
                        <div className="text-left">
                          <p
                            className={`font-passion text-[10px] font-bold uppercase tracking-[2px] ${field.value ? 'text-amber-800' : 'text-[#2a2118]/60'}`}
                          >
                            Lock Drop
                          </p>
                          <p
                            className={`text-[11px] font-light leading-tight ${field.value ? 'text-amber-700/70' : 'text-[#2a2118]/36'}`}
                          >
                            New joiners will require approval
                          </p>
                        </div>
                      </div>
                      <div
                        className={`relative h-5 w-9 rounded-full transition-colors ${field.value ? 'bg-amber-500' : 'bg-[#2a2118]/15'}`}
                      >
                        <span
                          className="absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-200"
                          style={{ transform: `translateX(${field.value ? '18px' : '2px'})` }}
                        />
                      </div>
                    </button>
                  )}
                />

                {serverError && (
                  <Alert className="rounded-[6px] border-red-200/50 bg-red-50 px-4 py-3">
                    <AlertDescription className="font-passion text-[11px] text-red-600">
                      {serverError.message ||
                        `Failed to ${isEdit ? 'update' : 'create'} drop. Please try again.`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={close}
                    className="h-auto rounded-full px-4 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-[#2a2118]/30 hover:bg-transparent hover:text-[#2a2118]/55"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-[46px] w-full rounded-[8px] bg-tok-teal px-6 font-passion text-[17px] tracking-[4px] text-[#F7E9B2] hover:bg-tok-teal/85 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isPending ? (
                      <>
                        <span className="h-[12px] w-[12px] animate-spin rounded-full border-2 border-[#F7E9B2]/30 border-t-[#F7E9B2]" />
                        {isEdit ? 'SAVING…' : 'DROPPING…'}
                      </>
                    ) : (
                      isEdit ? 'SAVE CHANGES' : 'DROP IT'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      }}
    </ModalShell>
  );
}
