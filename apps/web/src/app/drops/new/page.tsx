'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  ArrowLeft as IconArrowLeft,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Users as IconUsers,
  Zap as IconZap,
} from 'lucide-react';
import { useCreateDrop } from '@/hooks/mutations/use-drop-mutations';
import { useAuth } from '@/components/providers/auth-provider';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  location: z.string().min(1, 'Location is required'),
  expectedHeadcount: z.coerce.number().int().min(1).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function NewDropPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const createDrop = useCreateDrop();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', scheduledAt: '', location: '', expectedHeadcount: '' },
  });

  if (!loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/60">Sign in required to create a Drop.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const dto = {
      name: values.name,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      location: values.location,
      expectedHeadcount: values.expectedHeadcount ? Number(values.expectedHeadcount) : undefined,
    };

    const drop = await createDrop.mutateAsync(dto);
    router.push(`/drops/${drop.id}`);
  });

  return (
    <div className="min-h-screen bg-[#EDECE8] px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
        >
          <IconArrowLeft size={14} />
          Back
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <IconZap size={20} className="text-[#2a2118]/40" />
          <h1 className="font-mono text-2xl font-bold text-[#2a2118]">Create a Drop</h1>
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
                    placeholder="e.g. Beach Sunset Shoot"
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
                    placeholder="e.g. Sunset Beach, Manila"
                    className="w-full rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-4 py-2.5 font-mono text-sm text-[#2a2118] placeholder-[#2a2118]/30 outline-none focus:border-[#2a2118]/30"
                  />
                )}
              />
              {errors.location && (
                <p className="mt-1 font-mono text-xs text-red-500">{errors.location.message}</p>
              )}
            </div>

            {/* Expected Headcount */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#2a2118]/50">
                <IconUsers size={12} />
                Expected Headcount
                <span className="font-mono text-[10px] text-[#2a2118]/30">(optional)</span>
              </label>
              <Controller
                name="expectedHeadcount"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min={1}
                    placeholder="e.g. 20"
                    className="w-full rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-4 py-2.5 font-mono text-sm text-[#2a2118] placeholder-[#2a2118]/30 outline-none focus:border-[#2a2118]/30"
                  />
                )}
              />
              {errors.expectedHeadcount && (
                <p className="mt-1 font-mono text-xs text-red-500">{errors.expectedHeadcount.message}</p>
              )}
            </div>
          </div>

          {createDrop.error && (
            <p className="mt-4 font-mono text-xs text-red-500">
              {createDrop.error.message || 'Failed to create drop. Please try again.'}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="font-mono text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createDrop.isPending}
              className="rounded-lg bg-[#2a2118] px-5 py-2.5 font-mono text-sm font-semibold text-[#F7E9B2] transition-opacity disabled:opacity-50"
            >
              {createDrop.isPending ? 'Creating…' : 'Create Drop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
