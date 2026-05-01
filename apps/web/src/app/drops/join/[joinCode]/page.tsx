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
  Ticket as IconTicket,
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

  if (crewStatus === 'rejected' || crewStatus === 'removed') {
    const isJoining = joinMutation.isPending;
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-sm border-2 border-red-500/20 bg-red-500/5 px-4 py-2">
          <IconLock size={14} className="text-red-600" strokeWidth={2.5} />
          <span className="font-passion text-[11px] font-bold uppercase tracking-[1px] text-red-700">
            {crewStatus === 'rejected' ? 'Request Declined' : 'Removed from Crew'}
          </span>
        </div>
        
        <button
          disabled={isJoining}
          onClick={onJoin}
          className={`${baseBtn} bg-tok-teal text-[#F7E9B2] shadow-[8px_8px_0px_#1C1C1A] hover:shadow-[10px_10px_0px_#1C1C1A] disabled:opacity-50`}
        >
          {isJoining ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F7E9B2]/40 border-t-[#F7E9B2]" />
              Processing…
            </>
          ) : (
            'Try Joining Again'
          )}
        </button>
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

      <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <div className="relative">
          {/* Large background watermark text */}
          <div className="pointer-events-none absolute -left-10 -top-12 z-0 select-none font-passion text-[140px] font-bold uppercase leading-none text-tok-black/[0.03]">
            INVITE
          </div>

          <div className="relative overflow-hidden rounded-2xl border-[4px] border-tok-black bg-white shadow-[12px_12px_0px_#1C1C1A]">
            {/* Decorative Top Accent */}
            <div className="h-3 w-full bg-tok-teal" />

            <div className="p-8 sm:p-10">
              {/* Mission Header */}
              <div className="mb-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A]">
                    {drop.organiser.avatar ? (
                      <img
                        src={drop.organiser.avatar}
                        alt={organiserName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-passion text-lg font-bold text-tok-black">
                        {drop.organiser.firstName[0]}{drop.organiser.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/40 leading-none">
                      MISSION CHIEF
                    </p>
                    <p className="mt-1.5 truncate font-passion text-lg font-bold uppercase tracking-tight text-tok-black leading-none">
                      {organiserName}
                    </p>
                  </div>
                </div>
                <div className="hidden h-12 w-[2px] bg-tok-black/5 sm:block" />
                <div className="hidden flex-col items-end sm:flex">
                  <p className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-tok-black/40 leading-none">
                    JOIN CODE
                  </p>
                  <p className="mt-1.5 font-passion text-lg font-bold uppercase tracking-[2px] text-tok-teal leading-none">
                    {drop.joinCode}
                  </p>
                </div>
              </div>

              {/* Mission Title Section */}
              <div className="space-y-3">
                <p className="font-passion text-[11px] font-bold uppercase tracking-[5px] text-tok-teal">
                  YOU ARE INVITED TO
                </p>
                <h1 className="break-words font-passion text-[56px] font-bold uppercase leading-[0.85] tracking-tighter text-tok-black sm:text-[64px]">
                  {drop.name}
                </h1>
              </div>

              {/* Perforation Line Decoration */}
              <div className="relative my-12 flex items-center gap-4">
                {/* Hole punch effects using relative circles */}
                <div className="absolute -left-[64px] h-10 w-10 rounded-full border-[4px] border-tok-black bg-tok-cream shadow-inner" />
                <div className="h-[2px] flex-1 border-t-[3px] border-dashed border-tok-black/15" />
                <div className="absolute -right-[64px] h-10 w-10 rounded-full border-[4px] border-tok-black bg-tok-cream shadow-inner" />
              </div>

              {/* Mission Briefing Details */}
              <div className="grid grid-cols-1 gap-8">
                <div className="flex items-start gap-5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-teal/10 text-tok-teal shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                    <IconCalendar size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/30">DATE & TIME</p>
                    <p className="mt-0.5 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black leading-tight">
                      {formatDateTime(drop.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-[3px] border-tok-black bg-tok-teal/10 text-tok-teal shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                    <IconMapPin size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-black/30">LOCATION</p>
                    <p className="mt-0.5 truncate font-passion text-2xl font-bold uppercase tracking-tight text-tok-black leading-tight">
                      {drop.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Status Badge */}
              {drop.isLocked && (
                <div className="mt-12 flex items-center gap-4 rounded-sm border-[3px] border-tok-black bg-amber-400 p-5 shadow-[6px_6px_0px_#1C1C1A]">
                  <IconLock size={28} className="shrink-0" strokeWidth={2.5} />
                  <p className="font-passion text-[11px] font-bold uppercase leading-tight tracking-[1.5px] text-tok-black">
                    SECURED MISSION: ACCESS REQUIRES CHIEF APPROVAL AFTER TAP IN.
                  </p>
                </div>
              )}

              {/* Participation CTA Area */}
              <div className="mt-12 pt-8 border-t-[3px] border-tok-black/5">
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

            {/* Bottom Footer Stub Decoration */}
            <div className="flex items-center justify-center gap-6 border-t-[3px] border-tok-black bg-tok-black py-5 px-8 text-[#F7E9B2]">
              <div className="h-[2px] flex-1 bg-[#F7E9B2]/20" />
              <div className="flex items-center gap-3">
                <IconTicket size={16} className="text-[#F7E9B2]/40" />
                <p className="font-passion text-[11px] font-bold uppercase tracking-[6px] text-[#F7E9B2]">
                  {drop.joinCode}
                </p>
              </div>
              <div className="h-[2px] flex-1 bg-[#F7E9B2]/20" />
            </div>
          </div>

          {/* Branding Tagline */}
          <p className="mt-8 text-center font-passion text-[10px] font-bold uppercase tracking-[4px] text-tok-black/20">
            TapOK PROTOCOL v1.0 • SECURE INVITE SYSTEM
          </p>
        </div>
      </main>
    </div>
  );
}
