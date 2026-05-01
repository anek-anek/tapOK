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
  ArrowRight as IconArrowRight,
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
import toast from 'react-hot-toast';

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
  onJoin: () => void;
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
  onJoin,
  dbUser,
  joinCode,
}: JoinCtaProps) {
  const baseBtn = "inline-flex w-full items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black px-6 py-4 font-passion text-[13px] font-bold uppercase tracking-[2px] transition-all hover:-translate-y-0.5 active:translate-y-0";

  if (!dbUser) {
    return (
      <div className="space-y-3">
        <p className="mb-4 text-center font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
          SIGN IN TO JOIN THE CREW
        </p>
        <Link
          href={`/register?redirectTo=/drops/join/${joinCode}`}
          className={`${baseBtn} bg-tok-teal text-[#F7E9B2] shadow-[6px_6px_0px_#1C1C1A] hover:shadow-[8px_8px_0px_#1C1C1A]`}
        >
          <IconUserPlus size={16} strokeWidth={2.5} />
          Sign up to Tap In
        </Link>
        <Link
          href={`/login?redirectTo=/drops/join/${joinCode}`}
          className={`${baseBtn} bg-white text-tok-black shadow-[4px_4px_0px_#1C1C1A] hover:shadow-[6px_6px_0px_#1C1C1A]`}
        >
          <IconLogIn size={16} strokeWidth={2.5} />
          Log in
        </Link>
      </div>
    );
  }

  if (isOrganiser) {
    return (
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-sm border-2 border-tok-teal/20 bg-tok-teal/5 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-tok-teal animate-pulse" />
          <span className="font-passion text-[11px] font-bold uppercase tracking-[1px] text-tok-teal">YOU ORGANISED THIS DROP</span>
        </div>
        <button
          onClick={onViewDrop}
          className={`${baseBtn} bg-white text-tok-black shadow-[6px_6px_0px_#1C1C1A] hover:shadow-[8px_8px_0px_#1C1C1A]`}
        >
          View Dashboard
          <IconArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  if (crewStatus === 'in') {
    return (
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-sm border-2 border-tok-teal/20 bg-tok-teal/5 px-4 py-2">
          <IconCheckCircle size={14} className="text-tok-teal" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-[1px] text-tok-teal">YOU&apos;RE LOCKED IN</span>
        </div>
        <button
          onClick={onViewDrop}
          className={`${baseBtn} bg-white text-tok-black shadow-[6px_6px_0px_#1C1C1A] hover:shadow-[8px_8px_0px_#1C1C1A]`}
        >
          View Drop
          <IconArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  if (crewStatus === 'pending') {
    return (
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm border-2 border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <IconClock size={14} className="text-amber-600" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-[1px] text-amber-700">Awaiting Approval</span>
        </div>
        <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
          The organiser will review your request.
        </p>
      </div>
    );
  }

  if (crewStatus === 'rejected') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-sm border-2 border-red-500/20 bg-red-500/5 px-4 py-2">
          <IconLock size={14} className="text-red-600" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-[1px] text-red-700">Request Declined</span>
        </div>
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
          <p className="mb-4 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">
            You&apos;ve already joined this drop.
          </p>
          <button
            onClick={onViewDrop}
            className={`${baseBtn} bg-white text-tok-black shadow-[6px_6px_0px_#1C1C1A] hover:shadow-[8px_8px_0px_#1C1C1A]`}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return (
      <div>
        <button
          disabled={isJoining}
          onClick={onJoin}
          className={`${baseBtn} bg-tok-teal text-[#F7E9B2] shadow-[8px_8px_0px_#1C1C1A] hover:shadow-[10px_10px_0px_#1C1C1A] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0`}
        >
          {isJoining ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F7E9B2]/40 border-t-[#F7E9B2]" />
              Processing…
            </>
          ) : (
            <>
              {isLocked ? <IconLock size={16} strokeWidth={2.5} /> : <IconCheckCircle size={16} strokeWidth={2.5} />}
              Tap In to Crew
            </>
          )}
        </button>
        {isLocked && (
          <p className="mt-4 text-center font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/30">
            Request will be sent for approval
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

  const handleJoin = () => {
    track('crew_tap_in_clicked');
    joinMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.status === 'pending') {
          toast.success('REQUEST SENT FOR APPROVAL');
        } else {
          toast.success('YOU ARE LOCKED IN!');
        }
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO JOIN DROP';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const isOrganiser = Boolean(dbUser && drop && dbUser.id === drop.organiserId);
  const isNotCrew =
    isCrewError && axios.isAxiosError(crewError) && crewError.response?.status === 404;

  React.useEffect(() => {
    if (drop?.id) track('crew_invite_viewed', { dropId: drop.id });
  }, [drop?.id]);

  React.useEffect(() => {
    if (crewStatus?.status === 'in') track('crew_tapped_in', { dropId: drop?.id });
  }, [crewStatus?.status, drop?.id]);

  if (!mounted || isDropLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-tok-cream">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Skeleton className="mx-auto h-2 w-24 bg-tok-black/10" />
            <p className="mt-6 font-passion text-xs font-bold uppercase tracking-[3px] text-tok-black/20">Establishing connection…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isDropError || !drop) {
    return (
      <div className="flex min-h-screen flex-col bg-tok-cream">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border-[3px] border-tok-black bg-white p-8 text-center shadow-[12px_12px_0px_#1C1C1A]">
            <p className="font-passion text-lg font-bold uppercase tracking-tight text-tok-black">Drop Disconnected</p>
            <p className="mt-2 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black/40">Link expired or invalid token.</p>
            <Link href="/" className="mt-8 inline-block font-passion text-xs font-bold uppercase tracking-[2px] text-tok-teal underline underline-offset-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-tok-cream">
        <TapokNavbar />
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="mx-auto h-2 w-24 bg-tok-black/10" />
        </div>
      </div>
    );
  }

  const organiserName = `${drop.organiser.firstName} ${drop.organiser.lastName}`;

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/15">
      <TapokNavbar />

      <main className="mx-auto max-w-md px-4 py-8 sm:py-16">
        <div className="overflow-hidden rounded-2xl border-[3px] border-tok-black bg-white shadow-[12px_12px_0px_#1C1C1A]">
          {/* Header - Split Tone Teal */}
          <div className="border-b-[3px] border-tok-black bg-tok-teal px-6 py-8 text-[#F7E9B2]">
            <div className="flex flex-col gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-sm border-[3px] border-[#F7E9B2]/20 bg-[#F7E9B2]/10 font-passion text-2xl font-bold tracking-[0.1em] text-[#F7E9B2] shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                {getInitials(drop.name)}
              </div>
              <div>
                <p className="font-passion text-[10px] font-bold uppercase tracking-[4px] text-[#F7E9B2]/40">
                  {organiserName} IS DROPPING...
                </p>
                <h1 className="mt-1 font-passion text-4xl font-bold uppercase leading-none tracking-tighter">
                  {drop.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 rounded-sm border-2 border-tok-black/5 bg-tok-cream/20 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
                  <IconCalendar size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/30">SCHEDULED</p>
                  <p className="font-passion text-[13px] font-bold uppercase tracking-wide">{formatDateTime(drop.scheduledAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-sm border-2 border-tok-black/5 bg-tok-cream/20 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
                  <IconMapPin size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/30">LOCATION</p>
                  <p className="truncate font-passion text-[13px] font-bold uppercase tracking-wide">{drop.location}</p>
                </div>
              </div>

              {drop.expectedHeadcount ? (
                <div className="flex items-center gap-4 rounded-sm border-2 border-tok-black/5 bg-tok-cream/20 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
                    <IconUsers size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/30">CREW SIZE</p>
                    <p className="font-passion text-[13px] font-bold uppercase tracking-wide">{drop.expectedHeadcount} EXPECTED</p>
                  </div>
                </div>
              ) : null}
            </div>

            {drop.isLocked && (
              <div className="mt-4 flex items-center gap-3 rounded-sm border-[3px] border-tok-black bg-amber-400 p-4 shadow-[4px_4px_0px_#1C1C1A]">
                <IconLock size={20} className="shrink-0" strokeWidth={2.5} />
                <p className="font-passion text-[11px] font-bold uppercase leading-tight tracking-[1.5px]">
                  SECURE DROP: ACCESS REQUIRES ORGANISER APPROVAL.
                </p>
              </div>
            )}

            {/* CTA Container */}
            <div className="pt-4">
              <JoinCta
                isOrganiser={isOrganiser}
                crewStatus={crewStatus?.status}
                isNotCrew={isNotCrew}
                joinMutation={joinMutation}
                isLocked={drop.isLocked}
                onViewDrop={() => router.push(`/drops/${drop.id}`)}
                onJoin={handleJoin}
                dbUser={dbUser}
                joinCode={joinCode}
              />
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-tok-black/5 px-6 py-4 text-center">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[4px] text-tok-black/20">
              POWERED BY TapOK PROTOCOL v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
