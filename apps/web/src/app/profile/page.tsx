'use client';

import { useState } from 'react';
import { Mail, Phone, Calendar, Pencil, X, Check } from 'lucide-react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useCurrentUser } from '@/hooks/queries/use-users';
import { useUpdateUser } from '@/hooks/mutations/use-user-mutations';
import { useAuth } from '@/components/providers/auth-provider';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { FrequentCrewList } from '@/components/profile/frequent-crew-list';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ProfilePage() {
  const mounted = useMounted();
  const { dbUser } = useAuth();
  const { data: profile, isLoading } = useCurrentUser();
  const displayUser = profile ?? dbUser;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });

  const updateUser = useUpdateUser(profile?.id ?? '');

  function startEdit() {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!profile) return;
    const dto: { firstName?: string; lastName?: string; phone?: string } = {};
    if (form.firstName !== profile.firstName) dto.firstName = form.firstName;
    if (form.lastName !== profile.lastName) dto.lastName = form.lastName;
    if (form.phone !== (profile.phone ?? '')) dto.phone = form.phone || undefined;

    updateUser.mutate(dto, {
      onSuccess: () => setEditing(false),
    });
  }

  if (!mounted || (isLoading && !displayUser)) {
    return (
      <div className="min-h-screen bg-[#F7E9B2]">
        <TapokNavbar />
        <main className="relative mx-auto max-w-2xl px-6 py-16">
          <Skeleton className="mb-2 h-3 w-16 rounded-full bg-[#2a2118]/10" />
          <div className="mb-10 flex items-start justify-between">
            <Skeleton className="h-9 w-48 rounded bg-[#2a2118]/10" />
            <Skeleton className="h-8 w-16 rounded-lg bg-[#2a2118]/8" />
          </div>
          <div className="mb-8 flex items-center gap-6">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-[#2a2118]/10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded bg-[#2a2118]/10" />
              <Skeleton className="h-3 w-24 rounded-full bg-[#2a2118]/8" />
            </div>
          </div>
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC]">
            <div className="flex items-center gap-4 border-b border-[#2a2118]/8 px-6 py-4">
              <Skeleton className="h-4 w-4 rounded bg-[#2a2118]/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-10 rounded-full bg-[#2a2118]/8" />
                <Skeleton className="h-3.5 w-40 rounded-full bg-[#2a2118]/10" />
              </div>
            </div>
            <div className="flex items-center gap-4 border-b border-[#2a2118]/8 px-6 py-4">
              <Skeleton className="h-4 w-4 rounded bg-[#2a2118]/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-10 rounded-full bg-[#2a2118]/8" />
                <Skeleton className="h-3.5 w-28 rounded-full bg-[#2a2118]/10" />
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-4 w-4 rounded bg-[#2a2118]/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-16 rounded-full bg-[#2a2118]/8" />
                <Skeleton className="h-3.5 w-24 rounded-full bg-[#2a2118]/10" />
              </div>
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl bg-[#2a2118]/8" />
        </main>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-[#F7E9B2]">
        <TapokNavbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="font-mono text-sm text-[#2a2118]/40">No profile found.</span>
        </div>
      </div>
    );
  }

  const firstName = editing ? form.firstName : displayUser.firstName;
  const lastName = editing ? form.lastName : displayUser.lastName;
  const initials = getInitials(firstName || displayUser.firstName, lastName || displayUser.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const dropCount = profile?.dropCount ?? 0;

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
            Your Details
          </h1>

          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 rounded-lg border border-[#2a2118]/15 bg-[#FAF4DC] px-4 py-2 font-mono text-xs text-[#2a2118]/60 transition-colors hover:border-[#2a2118]/30 hover:text-[#2a2118]"
            >
              <Pencil size={12} />
              EDIT
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-lg border border-[#2a2118]/15 bg-[#FAF4DC] px-4 py-2 font-mono text-xs text-[#2a2118]/50 transition-colors hover:border-[#2a2118]/30"
              >
                <X size={12} />
                CANCEL
              </button>
              <button
                onClick={saveEdit}
                disabled={updateUser.isPending}
                className="flex items-center gap-2 rounded-lg bg-[#1A5C52] px-4 py-2 font-mono text-xs text-white transition-opacity disabled:opacity-50"
              >
                <Check size={12} />
                {updateUser.isPending ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div className="mb-8 flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/20 bg-[#2a2118] font-mono text-2xl font-bold text-[#F0E9C8]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  className="w-full rounded-lg border border-[#2a2118]/20 bg-[#FAF4DC] px-3 py-2 font-mono text-sm text-[#2a2118] outline-none focus:border-[#1A5C52]"
                />
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-[#2a2118]/20 bg-[#FAF4DC] px-3 py-2 font-mono text-sm text-[#2a2118] outline-none focus:border-[#1A5C52]"
                />
              </div>
            ) : (
              <p className="font-mono text-2xl font-bold text-[#2a2118] uppercase">{fullName}</p>
            )}
            {profile?.userHandle && !editing && (
              <p className="font-mono text-sm text-[#2a2118]/40">@{profile.userHandle}</p>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC]">
          {/* Email — read-only */}
          <div className="flex items-center gap-4 border-b border-[#2a2118]/8 px-6 py-4">
            <Mail size={16} className="shrink-0 text-[#2a2118]/40" />
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Email</p>
              <p className="font-mono text-sm text-[#2a2118]">{displayUser.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4 border-b border-[#2a2118]/8 px-6 py-4">
            <Phone size={16} className="shrink-0 text-[#2a2118]/40" />
            <div className="flex-1">
              <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Phone</p>
              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+639123456789"
                  className="mt-0.5 w-full rounded-lg border border-[#2a2118]/20 bg-[#F0E9C8] px-3 py-1.5 font-mono text-sm text-[#2a2118] outline-none focus:border-[#1A5C52]"
                />
              ) : (
                <p className="font-mono text-sm text-[#2a2118]">
                  {profile?.phone ?? <span className="text-[#2a2118]/30">Not set</span>}
                </p>
              )}
            </div>
          </div>

          {/* Member since — read-only */}
          <div className="flex items-center gap-4 px-6 py-4">
            <Calendar size={16} className="shrink-0 text-[#2a2118]/40" />
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Member since</p>
              <p className="font-mono text-sm text-[#2a2118]">
                {new Date(displayUser.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Drop count */}
        <div className="overflow-hidden rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC]">
          <div className="border-b border-[#2a2118]/8 px-6 py-3">
            <p className="font-mono text-[10px] tracking-widest text-[#2a2118]/40 uppercase">Activity</p>
          </div>
          <div className="flex items-center justify-between px-6 py-5">
            <p className="font-mono text-sm font-semibold text-[#2a2118] uppercase">Drops Created</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A5C52] font-mono text-sm font-bold text-white">
              {dropCount}
            </span>
          </div>
        </div>

        {/* Frequently Seen Crew */}
        <FrequentCrewList />

        {updateUser.isError && (
          <p className="mt-4 font-mono text-xs text-red-500">
            Failed to save. Please try again.
          </p>
        )}
      </main>
    </div>
  );
}
