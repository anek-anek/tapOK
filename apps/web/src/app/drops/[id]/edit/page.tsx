'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft as IconArrowLeft,
  Save as IconSave,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Zap as IconZap,
} from 'lucide-react';
import { useDrop } from '@/hooks/queries/use-drops';
import { useUpdateDrop } from '@/hooks/mutations/use-drop-mutations';
import { useAuth } from '@/components/providers/auth-provider';

const schema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  scheduledAt: z.string().optional(),
  location: z.string().min(1, 'Location is required').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditDropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { dbUser } = useAuth();
  const { data: drop, isLoading } = useDrop(id);
  const updateDrop = useUpdateDrop(id);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: drop
      ? {
          name: drop.name,
          scheduledAt: new Date(drop.scheduledAt).toISOString().slice(0, 16),
          location: drop.location,
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EDECE8] px-6 py-10">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-[#2a2118]/8" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-[#2a2118]/8" />
        </div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/60">Drop not found.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">Go home</Link>
        </div>
      </div>
    );
  }

  if (drop.status === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/70">This drop is completed and cannot be edited.</p>
          <Link href={`/drops/${id}`} className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">
            Back to drop
          </Link>
        </div>
      </div>
    );
  }

  if (dbUser && dbUser.id !== drop.organiserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/70">Only the organiser can edit this drop.</p>
          <Link href={`/drops/${id}`} className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">
            Back to drop
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const dto: { name?: string; scheduledAt?: string; location?: string } = {};
    if (values.name !== drop.name) dto.name = values.name;
    if (values.scheduledAt && new Date(values.scheduledAt).toISOString() !== drop.scheduledAt) {
      dto.scheduledAt = new Date(values.scheduledAt).toISOString();
    }
    if (values.location !== drop.location) dto.location = values.location;

    if (Object.keys(dto).length === 0) {
      router.push(`/drops/${id}`);
      return;
    }

    await updateDrop.mutateAsync(dto);
    router.push(`/drops/${id}`);
  });

  return (
    <div className="min-h-screen bg-[#EDECE8] px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/drops/${id}`}
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
        >
          <IconArrowLeft size={14} />
          Back to drop
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <IconZap size={20} className="text-[#2a2118]/40" />
          <div>
            <h1 className="font-mono text-2xl font-bold text-[#2a2118]">Edit Drop</h1>
            <p className="font-mono text-xs text-[#2a2118]/40">{drop.name}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#2a2118]/50">
                <IconZap size={12} />
                Drop Name
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-4 py-2.5 font-mono text-sm text-[#2a2118] placeholder-[#2a2118]/30 outline-none focus:border-[#2a2118]/30"
                  />
                )}
              />
              {errors.name && (
                <p className="mt-1 font-mono text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Date & Time */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#2a2118]/50">
                <IconCalendar size={12} />
                Date & Time
              </label>
              <Controller
                name="scheduledAt"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="datetime-local"
                    className="w-full rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-4 py-2.5 font-mono text-sm text-[#2a2118] outline-none focus:border-[#2a2118]/30"
                  />
                )}
              />
              {errors.scheduledAt && (
                <p className="mt-1 font-mono text-xs text-red-500">{errors.scheduledAt.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#2a2118]/50">
                <IconMapPin size={12} />
                Location
              </label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-4 py-2.5 font-mono text-sm text-[#2a2118] placeholder-[#2a2118]/30 outline-none focus:border-[#2a2118]/30"
                  />
                )}
              />
              {errors.location && (
                <p className="mt-1 font-mono text-xs text-red-500">{errors.location.message}</p>
              )}
            </div>
          </div>

          {updateDrop.error && (
            <p className="mt-4 font-mono text-xs text-red-500">
              {updateDrop.error.message || 'Failed to update drop. Please try again.'}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link
              href={`/drops/${id}`}
              className="font-mono text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateDrop.isPending}
              className="flex items-center gap-2 rounded-lg bg-[#2a2118] px-5 py-2.5 font-mono text-sm font-semibold text-[#F7E9B2] transition-opacity disabled:opacity-50"
            >
              <IconSave size={14} />
              {updateDrop.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
