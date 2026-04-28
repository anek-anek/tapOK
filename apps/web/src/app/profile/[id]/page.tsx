'use client';

import { use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, User as UserIcon } from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useUser } from '@/hooks/queries/use-users';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@repo/ui/components/ui/skeleton';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const { data: user, isLoading, isError } = useUser(id);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F7E9B2]">
        <TapokNavbar />
        <main className="relative mx-auto max-w-2xl px-6 py-16">
          <Skeleton className="mb-2 h-3 w-16 rounded-full bg-[#2a2118]/10" />
          <div className="mb-10 flex items-start justify-between">
            <Skeleton className="h-9 w-48 rounded bg-[#2a2118]/10" />
          </div>
          <div className="mb-8 flex items-center gap-6">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-[#2a2118]/10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded bg-[#2a2118]/10" />
              <Skeleton className="h-3 w-24 rounded-full bg-[#2a2118]/8" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl bg-[#2a2118]/8" />
        </main>
      </div>
    );
  }

  if (isError || !user) {
    return notFound();
  }

  const initials = getInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(0,102,102,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(42,33,24,0.08),transparent_28%)]" />

      <TapokNavbar />

      <main className="relative mx-auto max-w-2xl px-6 py-16">
        <p className="mb-2 font-mono text-xs tracking-widest text-[#2a2118]/40 uppercase">Profile</p>

        <div className="mb-10 flex items-start justify-between">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-[#2a2118] uppercase">
            User Info
          </h1>
        </div>

        {/* Avatar + name */}
        <div className="mb-8 flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/20 bg-[#2a2118] font-mono text-2xl font-bold text-[#F0E9C8] overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-2xl font-bold text-[#2a2118] uppercase">{fullName}</p>
            {user.userHandle && (
              <p className="font-mono text-sm text-[#2a2118]/40">@{user.userHandle}</p>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC]">
          <div className="flex items-center gap-4 border-b border-[#2a2118]/8 px-6 py-4">
            <UserIcon size={16} className="shrink-0 text-[#2a2118]/40" />
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Role</p>
              <p className="font-mono text-sm text-[#2a2118] uppercase">{user.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-6 py-4">
            <Calendar size={16} className="shrink-0 text-[#2a2118]/40" />
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Member since</p>
              <p className="font-mono text-sm text-[#2a2118]">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
