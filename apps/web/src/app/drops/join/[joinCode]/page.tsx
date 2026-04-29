'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Users as IconUsers,
  Lock as IconLock,
  CheckCircle2 as IconCheckCircle,
  Clock as IconClock,
  LogIn as IconLogIn,
  UserPlus as IconUserPlus,
} from 'lucide-react';
import { useDropByJoinCode, useMyCrewStatus } from '@/hooks/queries/use-drops';
import { useJoinDrop } from '@/hooks/mutations/use-drop-mutations';
import { useAuth } from '@/components/providers/auth-provider';
import { track } from '@/lib/analytics';
import { TapokNavbar } from '@/components/tapok-navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import type { DropCrew, DropCrewStatus } from '@/types/drop';
import type { UseMutationResult } from '@tanstack/react-query';

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'D'
  );
}

type JoinCtaProps = {
  isOrganiser: boolean;
  crewStatus: DropCrewStatus | undefined;
  isNotCrew: boolean;
  joinMutation: UseMutationResult<DropCrew, Error, void>;
  isLocked: boolean;
  onViewDrop: () => void;
  dbUser: { id: string } | null;
  joinCode: string;
};

function JoinCta({
  isOrganiser,
  crewStatus,
  isNotCrew,
  joinMutation,
  isLocked,
  onViewDrop,
  dbUser,
  joinCode,
}: JoinCtaProps) {
  if (!dbUser) {
    return (
      <div className="text-center">
        <p className="font-inter text-[11px] text-[#2a2118]/55">
          Sign in to tap in to this drop.
        </p>
        <Link
          href={`/register?redirectTo=/drops/join/${joinCode}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tok-teal px-6 py-3.5 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-colors hover:bg-tok-teal/90"
        >
          <IconUserPlus size={13} />
          Sign up to Tap In
        </Link>
        <Link
          href={`/login?redirectTo=/drops/join/${joinCode}`}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2a2118]/15 bg-transparent px-6 py-3 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#2a2118]/60 transition-colors hover:bg-[#2a2118]/5"
        >
          <IconLogIn size={13} />
          Log in
        </Link>
      </div>
    );
  }

  if (isOrganiser) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-tok-teal/10 px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-tok-teal" />
          <span className="font-inter text-[11px] font-medium text-tok-teal">You organised this drop</span>
        </div>
        <button
          onClick={onViewDrop}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2a2118]/15 bg-transparent px-6 py-3 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#2a2118]/60 transition-colors hover:bg-[#2a2118]/5"
        >
          View Drop
        </button>
      </div>
    );
  }

  if (crewStatus === 'in') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-tok-teal/10 px-4 py-2">
          <IconCheckCircle size={13} className="text-tok-teal" />
          <span className="font-inter text-[11px] font-medium text-tok-teal">You&apos;re In</span>
        </div>
        <p className="mt-2 font-inter text-[10px] text-[#2a2118]/40">
          You&apos;re locked in. Everyone knows where you stand.
        </p>
        <button
          onClick={onViewDrop}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2a2118]/15 bg-transparent px-6 py-3 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#2a2118]/60 transition-colors hover:bg-[#2a2118]/5"
        >
          View Drop
        </button>
      </div>
    );
  }

  if (crewStatus === 'pending') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-2">
          <IconClock size={13} className="text-amber-700" />
          <span className="font-inter text-[11px] font-medium text-amber-700">Awaiting Approval</span>
        </div>
        <p className="mt-3 font-inter text-[11px] text-[#2a2118]/44">
          The organiser will review your request.
        </p>
      </div>
    );
  }

  if (crewStatus === 'rejected') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100/80 px-4 py-2">
          <IconLock size={13} className="text-red-700" />
          <span className="font-inter text-[11px] font-medium text-red-700">Request Declined</span>
        </div>
        <p className="mt-3 font-inter text-[11px] text-[#2a2118]/44">
          The organiser has declined your request to join.
        </p>
      </div>
    );
  }

  if (isNotCrew) {
    const isJoining = joinMutation.isPending;
    const joinError = joinMutation.error;
    const isAlreadyJoinedError =
      axios.isAxiosError(joinError) && joinError.response?.status === 409;

    if (isAlreadyJoinedError) {
      return (
        <div className="text-center">
          <p className="font-inter text-[12px] text-[#2a2118]/55">
            You&apos;ve already joined this drop.
          </p>
          <button
            onClick={onViewDrop}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2a2118]/15 bg-transparent px-6 py-3 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#2a2118]/60 transition-colors hover:bg-[#2a2118]/5"
          >
            View Drop
          </button>
        </div>
      );
    }

    return (
      <div>
        <button
          disabled={isJoining}
          onClick={() => { track('crew_tap_in_clicked'); joinMutation.mutate(); }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tok-teal px-6 py-3.5 font-passion text-[11px] font-bold uppercase tracking-[2px] text-[#F7E9B2] transition-colors hover:bg-tok-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isJoining ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#F7E9B2]/40 border-t-[#F7E9B2]" />
              Joining…
            </>
          ) : (
            <>
              {isLocked ? <IconLock size={13} /> : <IconCheckCircle size={13} />}
              Tap In
            </>
          )}
        </button>
        {isLocked && (
          <p className="mt-2 text-center font-inter text-[10px] text-[#2a2118]/40">
            Your request will be sent for approval
          </p>
        )}
        {joinError && !isAlreadyJoinedError && (
          <p className="mt-2 text-center font-inter text-[11px] text-red-600/70">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function JoinDropPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = React.use(params);
  const router = useRouter();
  const mounted = useMounted();

  const { data: drop, isError: isDropError, isLoading: isDropLoading } = useDropByJoinCode(joinCode);
  const { dbUser, loading: authLoading } = useAuth();

  const { data: crewStatus, isError: isCrewError, error: crewError } = useMyCrewStatus(
    drop?.id ?? '',
    { enabled: Boolean(drop?.id && dbUser) },
  );

  const joinMutation = useJoinDrop(drop?.id ?? '');

  const isOrganiser = Boolean(dbUser && drop && dbUser.id === drop.organiserId);
  const isNotCrew =
    isCrewError && axios.isAxiosError(crewError) && crewError.response?.status === 404;

  // Track when the invite page is first rendered with a valid drop
  React.useEffect(() => {
    if (drop?.id) track('crew_invite_viewed', { dropId: drop.id });
  }, [drop?.id]);

  // Track when the crew member successfully taps In
  React.useEffect(() => {
    if (crewStatus?.status === 'in') track('crew_tapped_in', { dropId: drop?.id });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewStatus?.status]);

  if (!mounted || isDropLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#EDECE8]">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Skeleton className="mx-auto h-1.5 w-20 rounded-full bg-[#2a2118]/15" />
            <p className="mt-4 font-inter text-xs text-[#2a2118]/40">Looking up drop…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isDropError || !drop) {
    return (
      <div className="flex min-h-screen flex-col bg-[#EDECE8]">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-5 text-center sm:p-8">
            <p className="font-inter text-sm text-[#2a2118]/60">Drop not found or the link has expired.</p>
            <Link href="/" className="mt-4 inline-block font-inter text-xs text-[#2a2118]/40 underline">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#EDECE8]">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="mx-auto h-1.5 w-20 rounded-full bg-[#2a2118]/15" />
        </div>
      </div>
    );
  }

  const organiserName = `${drop.organiser.firstName} ${drop.organiser.lastName}`;

  return (
    <div className="min-h-screen bg-[#EDECE8] text-[#2a2118] selection:bg-tok-teal/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <TapokNavbar />

      <main className="relative mx-auto max-w-md px-4 py-6 sm:py-12">
        <div className="overflow-hidden rounded-[24px] border border-[#2a2118]/8 bg-[#F7E9B2]/70 shadow-[0_14px_40px_rgba(42,33,24,0.07)] sm:rounded-[28px]">
          {/* Header */}
          <div className="border-b border-[#2a2118]/8 bg-[#F7E9B2]/50 px-4 py-5 sm:px-6">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tok-teal font-passion text-[12px] font-bold tracking-widest text-[#F7E9B2] sm:h-12 sm:w-12 sm:text-[13px]">
                {getInitials(drop.name)}
              </div>
              <div className="min-w-0">
                <p className="font-inter text-[9px] uppercase tracking-[2px] text-[#2a2118]/44">
                  {organiserName} made a drop — are you in?
                </p>
                <h1 className="truncate font-passion text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118] sm:text-[20px]">
                  {drop.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 px-4 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <IconCalendar size={14} className="shrink-0 text-[#2a2118]/40" />
              <span className="font-inter text-[12px] text-[#2a2118]/70">{formatDateTime(drop.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <IconMapPin size={14} className="shrink-0 text-[#2a2118]/40" />
              <span className="min-w-0 wrap-break-word font-inter text-[12px] text-[#2a2118]/70">{drop.location}</span>
            </div>
            {drop.expectedHeadcount && (
              <div className="flex items-center gap-3">
                <IconUsers size={14} className="shrink-0 text-[#2a2118]/40" />
                <span className="font-inter text-[12px] text-[#2a2118]/70">{drop.expectedHeadcount} expected</span>
              </div>
            )}
            <div className="pt-0.5">
              <span className="font-inter text-[11px] text-[#2a2118]/44">by {organiserName}</span>
            </div>
            {drop.isLocked && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50/80 px-3 py-2">
                <IconLock size={12} className="shrink-0 text-amber-700" />
                <span className="font-inter text-[11px] text-amber-700">This drop requires approval to join</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-[#2a2118]/8 px-4 py-5 sm:px-6">
            <JoinCta
              isOrganiser={isOrganiser}
              crewStatus={crewStatus?.status}
              isNotCrew={isNotCrew}
              joinMutation={joinMutation}
              isLocked={drop.isLocked}
              onViewDrop={() => router.push(`/drops/${drop.id}`)}
              dbUser={dbUser}
              joinCode={joinCode}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
