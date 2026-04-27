'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X as IconX,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Users as IconUsers,
  Lock as IconLock,
} from 'lucide-react';
import {
  useCreateDrop,
  useUpdateDrop,
} from '@/hooks/mutations/use-drop-mutations';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Separator } from '@repo/ui/components/ui/separator';
import { cn } from '@repo/ui/utils';
import type { Drop, DropStatus } from '@/types/drop';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  location: z.string().min(1, 'Location is required'),
  expectedHeadcount: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.literal('')),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  scheduledAt: z.string().optional(),
  location: z.string().min(1, 'Location is required').optional(),
  isLocked: z.boolean().optional(),
});

type CreateValues = {
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount: number | '' | undefined;
};
type EditValues = z.infer<typeof editSchema>;

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

function LivePreviewCard({
  name,
  scheduledAt,
  location,
  expectedHeadcount,
}: {
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount: string | number | undefined;
}) {
  const date = formatPreviewDate(scheduledAt);
  const count = expectedHeadcount ? Number(expectedHeadcount) : 0;
  const hasAny = !!(name || scheduledAt || location);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        hasAny ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-35',
      )}
    >
      <Card className="w-full max-w-[220px] gap-0 rounded-[10px] border border-[#2a2118]/10 bg-[#F7E9B2] p-5 ring-0">
        <CardContent className="px-0">
          <Badge
            variant="outline"
            className="mb-3 h-auto gap-[6px] rounded-full border-[#006666]/15 bg-[#006666]/10 px-2 py-1 font-syne text-[8px] font-bold uppercase tracking-[2px] text-[#006666]"
          >
            <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#006666]" />
            Active
          </Badge>
          <div className="mb-3 min-h-[27px] font-bebas text-[22px] leading-tight tracking-[1.5px] text-[#2a2118]">
            {name || <span className="opacity-20">Your drop name</span>}
          </div>
          <div className="space-y-[5px]">
            <div className="flex items-center gap-[6px] text-[10px] font-light text-[#2a2118]/50">
              <IconCalendar size={9} className="opacity-40 flex-shrink-0" />
              {date ?? <span className="opacity-40">Date &amp; time</span>}
            </div>
            <div className="flex items-center gap-[6px] text-[10px] font-light text-[#2a2118]/50">
              <IconMapPin size={9} className="opacity-40 flex-shrink-0" />
              <span className="truncate">
                {location || <span className="opacity-40">Location</span>}
              </span>
            </div>
            {count > 0 && (
              <div className="flex items-center gap-[6px] text-[10px] font-light text-[#2a2118]/50">
                <IconUsers size={9} className="opacity-40 flex-shrink-0" />
                {count} expected
              </div>
            )}
          </div>
          <Separator className="mt-3 bg-[#2a2118]/[0.07]" />
          <div className="pt-3">
            <div className="font-syne text-[7px] font-bold tracking-[2px] uppercase text-[#2a2118]/18 mb-[4px]">
              Join Code
            </div>
            <div className="font-syne text-[11px] font-bold tracking-[5px] text-[#2a2118]/14 select-none">
              ------
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const CLOSE_DURATION = 260;

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const triggerClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, CLOSE_DURATION);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [triggerClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-[3px]"
        style={{
          animation: closing
            ? `tapok-fadeOut ${CLOSE_DURATION}ms ease-in forwards`
            : 'tapok-fadeIn 200ms ease-out',
        }}
        onClick={triggerClose}
      />
      <div
        className="relative z-10 max-h-[92dvh] w-full overflow-hidden overflow-y-auto rounded-t-[28px] shadow-[0_40px_100px_rgba(42,33,24,0.45)] sm:max-w-[720px] sm:rounded-[28px]"
        style={{
          animation: closing
            ? `tapok-slideDown ${CLOSE_DURATION}ms cubic-bezier(0.4,0,1,1) forwards`
            : 'tapok-slideUp 280ms cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >
        {typeof children === 'function' ? children(triggerClose) : children}
      </div>
      <style>{`
        @keyframes tapok-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tapok-fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes tapok-slideUp   { from { opacity: 0; transform: translateY(28px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes tapok-slideDown { from { opacity: 1; transform: translateY(0)    scale(1)    } to { opacity: 0; transform: translateY(22px) scale(0.97) } }
      `}</style>
    </div>
  );
}

export function CreateDropModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const createDrop = useCreateDrop();
  const pendingIdRef = useRef<string | null>(null);

  const wrappedClose = useCallback(() => {
    onClose();
    if (pendingIdRef.current) {
      router.push(`/drops/${pendingIdRef.current}`);
    }
  }, [onClose, router]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSchema) as any,
    defaultValues: {
      name: '',
      scheduledAt: '',
      location: '',
      expectedHeadcount: '',
    },
  });

  const [name, scheduledAt, location, expectedHeadcount] = watch([
    'name',
    'scheduledAt',
    'location',
    'expectedHeadcount',
  ]);

  return (
    <ModalShell onClose={wrappedClose}>
      {(close) => {
        const onSubmit = handleSubmit(async (values) => {
          const dto = {
            name: values.name,
            scheduledAt: new Date(values.scheduledAt).toISOString(),
            location: values.location,
            expectedHeadcount: values.expectedHeadcount
              ? Number(values.expectedHeadcount)
              : undefined,
          };
          const drop = await createDrop.mutateAsync(dto);
          pendingIdRef.current = drop.id;
          close();
        });

        return (
          <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
            {/* Dark left panel — desktop only */}
            <aside className="relative hidden overflow-hidden bg-[#2a2118] px-7 pb-8 pt-8 sm:flex sm:flex-col sm:justify-between">
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#F7E9B2_1px,transparent_0)] [background-size:22px_22px]" />
              <div>
                <p className="mb-5 font-syne text-[8px] font-bold uppercase tracking-[3px] text-[#F7E9B2]/22">
                  TapOk
                </p>
                <div
                  className="select-none font-bebas leading-[0.88] tracking-[2px] text-[#F7E9B2]/[0.08]"
                  style={{ fontSize: 'clamp(52px,5.5vw,72px)' }}
                  aria-hidden
                >
                  DROP
                  <br />
                  IT.
                </div>
                <p className="mt-3 max-w-[160px] text-[11px] font-light leading-relaxed text-[#F7E9B2]/28">
                  Set the time. Set the place. Drop it.
                </p>
              </div>
              <div>
                <p className="mb-3 font-syne text-[8px] font-bold uppercase tracking-[2.5px] text-[#F7E9B2]/22">
                  Preview
                </p>
                <LivePreviewCard
                  name={name}
                  scheduledAt={scheduledAt}
                  location={location}
                  expectedHeadcount={expectedHeadcount}
                />
              </div>
            </aside>

            {/* Form panel */}
            <div className="flex flex-col bg-[#F7E9B2] px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-1 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#006666]">
                    Create
                  </p>
                  <div className="font-bebas text-[32px] leading-none tracking-[2px] text-[#2a2118]">
                    New Drop.
                  </div>
                  <p className="mt-1.5 text-[12px] font-light text-[#2a2118]/44">
                    Fill in the details and drop it.
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

              <form onSubmit={onSubmit} className="flex flex-1 flex-col space-y-4">
                <div>
                  <Label
                    htmlFor="create-drop-name"
                    className="mb-2 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
                  >
                    Drop Name
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="create-drop-name"
                        type="text"
                        placeholder="e.g. Rooftop Drinks"
                        autoFocus
                        aria-invalid={Boolean(errors.name)}
                        className="h-auto rounded-[8px] border-[#2a2118]/[0.09] bg-white/75 px-4 py-3 text-[15px] font-semibold text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-[#006666]/45 focus-visible:ring-[#006666]/15"
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <Label
                      htmlFor="create-drop-date"
                      className="mb-2 flex items-center gap-1.5 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
                    >
                      <IconCalendar size={8} className="opacity-50" />
                      Date &amp; Time
                    </Label>
                    <Controller
                      name="scheduledAt"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="create-drop-date"
                          type="datetime-local"
                          aria-invalid={Boolean(errors.scheduledAt)}
                          className="h-auto rounded-[8px] border-[#2a2118]/[0.09] bg-white/75 px-3 py-3 text-sm text-[#2a2118] focus-visible:border-[#006666]/45 focus-visible:ring-[#006666]/15"
                        />
                      )}
                    />
                    {errors.scheduledAt && (
                      <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                        {errors.scheduledAt.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="create-drop-location"
                      className="mb-2 flex items-center gap-1.5 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
                    >
                      <IconMapPin size={8} className="opacity-50" />
                      Location
                    </Label>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="create-drop-location"
                          type="text"
                          placeholder="e.g. Sunset Beach"
                          aria-invalid={Boolean(errors.location)}
                          className="h-auto rounded-[8px] border-[#2a2118]/[0.09] bg-white/75 px-3 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-[#006666]/45 focus-visible:ring-[#006666]/15"
                        />
                      )}
                    />
                    {errors.location && (
                      <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="create-drop-headcount"
                    className="mb-2 flex items-center gap-1.5 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36"
                  >
                    <IconUsers size={8} className="opacity-50" />
                    Headcount
                    <span className="font-normal normal-case tracking-normal text-[#2a2118]/22">
                      — optional
                    </span>
                  </Label>
                  <Controller
                    name="expectedHeadcount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="create-drop-headcount"
                        type="number"
                        min={1}
                        placeholder="e.g. 20"
                        className="h-auto rounded-[8px] border-[#2a2118]/[0.09] bg-white/75 px-4 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/20 focus-visible:border-[#006666]/45 focus-visible:ring-[#006666]/15"
                      />
                    )}
                  />
                </div>

                {createDrop.error && (
                  <Alert className="rounded-[6px] border-red-200/50 bg-red-50 px-4 py-3">
                    <AlertDescription className="font-syne text-[11px] text-red-600">
                      {createDrop.error.message ||
                        'Failed to create drop. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={close}
                    className="h-auto rounded-full px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-[#2a2118]/30 hover:bg-transparent hover:text-[#2a2118]/55"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDrop.isPending}
                    className="h-[46px] w-full rounded-[8px] bg-[#006666] px-6 font-bebas text-[17px] tracking-[4px] text-[#F7E9B2] hover:bg-[#006666]/85 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {createDrop.isPending ? (
                      <>
                        <span className="h-[12px] w-[12px] animate-spin rounded-full border-2 border-[#F7E9B2]/30 border-t-[#F7E9B2]" />
                        DROPPING…
                      </>
                    ) : (
                      'DROP IT'
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

const STATUS_LABEL: Record<DropStatus, string> = {
  active: 'Active',
  ongoing: 'Ongoing',
  completed: 'Done',
};

const STATUS_CLS: Record<DropStatus, string> = {
  active: 'text-emerald-700 bg-emerald-500/[0.12] border-emerald-500/20',
  ongoing: 'text-amber-700 bg-amber-500/[0.12] border-amber-500/20',
  completed: 'text-[#2a2118]/38 bg-[#2a2118]/6 border-[#2a2118]/10',
};

const STATUS_DOT: Record<DropStatus, string> = {
  active: 'bg-emerald-500',
  ongoing: 'bg-amber-500',
  completed: 'bg-[#2a2118]/30',
};

function formatDate(iso: string) {
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
    return iso;
  }
}

export function EditDropModal({
  drop,
  onClose,
}: {
  drop: Drop;
  onClose: () => void;
}) {
  const updateDrop = useUpdateDrop(drop.id);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      name: drop.name,
      scheduledAt: new Date(drop.scheduledAt).toISOString().slice(0, 16),
      location: drop.location,
      isLocked: drop.isLocked,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const dto: {
      name?: string;
      scheduledAt?: string;
      location?: string;
      isLocked?: boolean;
    } = {};
    if (values.name !== drop.name) dto.name = values.name;
    if (
      values.scheduledAt &&
      new Date(values.scheduledAt).toISOString() !== drop.scheduledAt
    ) {
      dto.scheduledAt = new Date(values.scheduledAt).toISOString();
    }
    if (values.location !== drop.location) dto.location = values.location;
    if (values.isLocked !== drop.isLocked) dto.isLocked = values.isLocked;

    if (Object.keys(dto).length === 0) {
      onClose();
      return;
    }

    await updateDrop.mutateAsync(dto);
    onClose();
  });

  return (
    <ModalShell onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
        {/* Dark left panel — context, desktop only */}
        <div className="hidden sm:flex flex-col justify-between bg-[#2a2118] px-7 pt-8 pb-8">
          <div>
            <p className="font-syne text-[8px] font-bold tracking-[3px] uppercase text-[#F7E9B2]/22 mb-4">
              Editing
            </p>
            <div
              className="font-bebas tracking-[1.5px] text-[#F7E9B2] leading-tight mb-3"
              style={{ fontSize: 'clamp(22px,2.8vw,30px)' }}
            >
              {drop.name}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 font-syne text-[8px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded-full border ${STATUS_CLS[drop.status]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[drop.status]}`}
              />
              {STATUS_LABEL[drop.status]}
            </span>
          </div>

          <div className="space-y-2.5 text-[11px] font-light text-[#F7E9B2]/30">
            <div className="flex items-center gap-2">
              <IconCalendar size={10} className="opacity-60 flex-shrink-0" />
              {formatDate(drop.scheduledAt)}
            </div>
            <div className="flex items-center gap-2">
              <IconMapPin size={10} className="opacity-60 flex-shrink-0" />
              <span className="truncate">{drop.location}</span>
            </div>
            <div className="mt-5 pt-5 border-t border-[#F7E9B2]/[0.06]">
              <p className="font-syne text-[8px] font-bold tracking-[2.5px] uppercase text-[#F7E9B2]/18 mb-1.5">
                Join Code
              </p>
              <p className="font-syne text-[15px] font-bold tracking-[5px] text-[#F7E9B2]/22">
                {drop.joinCode}
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col bg-[#F7E9B2] px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="sm:hidden">
                <p className="font-syne text-[9px] font-bold tracking-[2px] uppercase text-[#006666] mb-0.5">
                  Editing
                </p>
                <div className="font-bebas text-[24px] tracking-[1.5px] text-[#2a2118] leading-tight truncate max-w-[220px]">
                  {drop.name}
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-[#006666] mb-1">
                  Edit
                </p>
                <div className="font-bebas text-[32px] tracking-[2px] text-[#2a2118] leading-none">
                  What changed?
                </div>
                <p className="text-[12px] font-light text-[#2a2118]/44 mt-1.5">
                  Update what needs changing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/12 text-[#2a2118]/36 hover:border-[#2a2118]/22 hover:text-[#2a2118] transition-colors mt-0.5"
            >
              <IconX size={14} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 flex-1">
            <div>
              <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-[#2a2118]/36 mb-2">
                Drop Name
              </div>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    autoFocus
                    className="w-full bg-white/75 border border-[#2a2118]/[0.09] rounded-[8px] px-4 py-3 text-[15px] font-semibold text-[#2a2118] outline-none focus:border-[#006666]/45 transition-colors"
                  />
                )}
              />
              {errors.name && (
                <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div>
                <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-[#2a2118]/36 mb-2 flex items-center gap-1.5">
                  <IconCalendar size={8} className="opacity-50" />
                  Date &amp; Time
                </div>
                <Controller
                  name="scheduledAt"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="datetime-local"
                      className="w-full bg-white/75 border border-[#2a2118]/[0.09] rounded-[8px] px-3 py-3 text-sm text-[#2a2118] outline-none focus:border-[#006666]/45 transition-colors"
                    />
                  )}
                />
                {errors.scheduledAt && (
                  <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                    {errors.scheduledAt.message}
                  </p>
                )}
              </div>
              <div>
                <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-[#2a2118]/36 mb-2 flex items-center gap-1.5">
                  <IconMapPin size={8} className="opacity-50" />
                  Location
                </div>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full bg-white/75 border border-[#2a2118]/[0.09] rounded-[8px] px-3 py-3 text-sm text-[#2a2118] placeholder:text-[#2a2118]/20 outline-none focus:border-[#006666]/45 transition-colors"
                    />
                  )}
                />
                {errors.location && (
                  <p className="mt-1.5 font-syne text-[10px] text-red-500/80">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>

            <Controller
              name="isLocked"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`flex w-full items-center justify-between rounded-[10px] border px-4 py-3 transition-colors ${
                    field.value
                      ? 'border-amber-400/40 bg-amber-50/80'
                      : 'border-[#2a2118]/[0.09] bg-white/75 hover:border-[#2a2118]/18'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconLock
                      size={13}
                      className={
                        field.value ? 'text-amber-700' : 'text-[#2a2118]/30'
                      }
                    />
                    <div className="text-left">
                      <p
                        className={`font-syne text-[10px] font-bold uppercase tracking-[2px] ${field.value ? 'text-amber-800' : 'text-[#2a2118]/60'}`}
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
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0.5'}`}
                    />
                  </div>
                </button>
              )}
            />

            {updateDrop.error && (
              <div className="bg-red-50 border border-red-200/50 rounded-[6px] px-4 py-3">
                <p className="font-syne text-[11px] text-red-600">
                  {updateDrop.error.message ||
                    'Failed to update drop. Please try again.'}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="py-2 text-center font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-[#2a2118]/30 transition-colors hover:text-[#2a2118]/55"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateDrop.isPending}
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#2a2118] px-6 font-bebas text-[17px] tracking-[4px] text-[#F7E9B2] transition-all hover:bg-[#2a2118]/80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {updateDrop.isPending ? (
                  <>
                    <div className="w-[12px] h-[12px] border-2 border-[#F7E9B2]/30 border-t-[#F7E9B2] rounded-full animate-spin" />
                    SAVING…
                  </>
                ) : (
                  'SAVE CHANGES'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalShell>
  );
}
