'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft as IconArrowLeft,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Share2 as IconShare2,
  Edit3 as IconEdit,
  Trash2 as IconTrash,
  X as IconX,
  LogOut as IconLogOut,
  Clock as IconClock,
  UserCheck as IconUserCheck,
  Lock as IconLock,
  Martini as IconMartini,
  Users as IconUsers,
  ShieldCheck as IconShieldCheck,
} from 'lucide-react';
import { useDrop, useMyCrewStatus, useDropCrew } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { DropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { DeleteDropModal } from '@/components/drops/DeleteDropModal';
import { DigitalTicket, DigitalTicketSkeleton } from '@/components/drops/DigitalTicket';
import { PhotoRoll, PhotoRollSkeleton } from '@/components/drops/PhotoRoll';
import { CrewRoster, CrewRosterSkeleton } from '@/components/drops/CrewRoster';
import { ActivityLedger, ActivityLedgerSkeleton } from '@/components/drops/ActivityLedger';
import { DropSuppliesAccordion } from '@/components/drops/NeededItems';
import { ModalShell } from '@/components/modal-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaveDrop, useApproveJoinRequest, useRejectJoinRequest, useRemoveCrewMember, useUpdatePresence, useJoinDrop, useUpdateCrewRole } from '@/hooks/mutations/use-drop-mutations';
import { SparkButton, SparkButtonSkeleton } from '@/components/drops/spark-button';
import { DropCrewProfileModal, type DropCrewProfileSubject } from '@/components/drops/DropCrewProfileModal';
import { toast } from 'react-hot-toast';
import type { DropStatus } from '@/types/drop';
import { coverPhotoSrcForNextImage } from '@/lib/config';
import { evaluateDropMinimumAgeEligibility, getJoinDropErrorMessage } from '@/lib/drop-minimum-age';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_META: Record<DropStatus, { label: string; tone: string; dot: string; pulse: boolean }> = {
  active: {
    label: 'Upcoming',
    tone: 'bg-amber-400 text-black border-black',
    dot: 'bg-black',
    pulse: false,
  },
  ongoing: {
    label: 'Ongoing',
    tone: 'bg-emerald-500 text-white border-black',
    dot: 'bg-white',
    pulse: true,
  },
  completed: {
    label: 'Finished',
    tone: 'bg-[#1C1C1A]/10 text-[#1C1C1A]/40 border-[#1C1C1A]/10',
    dot: 'bg-[#1C1C1A]/20',
    pulse: false,
  },
};

function StatusPill({ status, scheduledAt }: { status: DropStatus; scheduledAt: string }) {
  const isActuallyLive = status === 'ongoing' || (status === 'active' && new Date() >= new Date(scheduledAt));
  const effectiveStatus = isActuallyLive ? 'ongoing' : status;
  const meta = STATUS_META[effectiveStatus];

  return (
    <span className={cn(
      "h-8 sm:h-10 inline-flex items-center gap-1.5 rounded-sm border-2 px-2 font-passion text-[10px] font-bold uppercase tracking-[1px] shadow-[2px_2px_0px_#1C1C1A] sm:gap-2 sm:px-3 sm:tracking-[1.5px]",
      meta.tone
    )}>
      {meta.pulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0 sm:h-2 sm:w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${meta.dot}`} />
        </span>
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${meta.dot}`} />
      )}
      <span className={cn(
        "pt-0.5",
        meta.tone.includes('text-white') && "[text-shadow:0_1px_1px_rgba(0,0,0,0.4)]"
      )}>
        {meta.label}
      </span>
    </span>
  );
}

function getLogInitials(firstName: string, lastName: string) {
  return `${firstName[0]?.toUpperCase() ?? ''}${lastName[0]?.toUpperCase() ?? ''}` || 'U';
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LeaveConfirmModal({
  dropName,
  onConfirm,
  onClose,
  isPending,
}: {
  dropName: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <ModalShell onClose={!isPending ? onClose : () => { }}>
      {(close) => (
        <div className="rounded-[4px] border-[3px] border-tok-black bg-tok-cream p-6 shadow-[8px_8px_0px_#1C1C1A]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-red-600">
              Abandon Drop
            </p>
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-colors hover:bg-red-50 disabled:opacity-40"
            >
              <IconX size={16} strokeWidth={2.5} />
            </button>
          </div>
          <h3 className="mt-1 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
            ARE YOU SURE?
          </h3>
          <p className="mt-3 font-inter text-sm leading-relaxed text-tok-black/60">
            You&apos;ll be removed from{' '}
            <span className="font-bold text-tok-black">{dropName}</span> and lose
            access immediately. Re-entry requires the join code.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-white py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-red-500 py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-60"
            >
              {isPending ? 'Leaving…' : 'Leave drop'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function RemoveMemberConfirmModal({
  memberName,
  onConfirm,
  onClose,
  isPending,
}: {
  memberName: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <ModalShell onClose={!isPending ? onClose : () => { }}>
      {(close) => (
        <div className="rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[8px_8px_0px_#1C1C1A]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-red-500">
              Eject Crew
            </p>
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-colors hover:bg-red-50 disabled:opacity-40"
            >
              <IconX size={16} strokeWidth={2.5} />
            </button>
          </div>
          <h3 className="mt-1 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
            REMOVE FROM CREW?
          </h3>
          <p className="mt-3 font-inter text-sm leading-relaxed text-tok-black/60">
            You are about to remove <span className="font-bold text-tok-black">{memberName}</span> from the crew.
            They will lose access to the mission log and live activity immediately.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-white py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-red-500 py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-60"
            >
              {isPending ? 'Removing…' : 'Remove Crew'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function JoinConfirmModal({
  drop,
  onConfirm,
  onClose,
  isPending,
}: {
  drop: any;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <ModalShell onClose={!isPending ? onClose : () => { }}>
      {(close) => (
        <div className="rounded-[4px] border-[3px] border-tok-black bg-tok-cream p-6 shadow-[8px_8px_0px_#1C1C1A]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-tok-teal">
              Join Mission
            </p>
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-colors hover:bg-tok-teal/5 disabled:opacity-40"
            >
              <IconX size={16} strokeWidth={2.5} />
            </button>
          </div>
          <h3 className="mt-1 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
            {drop.isLocked ? 'REQUEST TO JOIN?' : 'JOIN THE CREW?'}
          </h3>
          <p className="mt-3 font-inter text-sm leading-relaxed text-tok-black/60">
            {drop.isLocked
              ? "This drop is locked. The chief will need to approve your request before you're in the crew."
              : "You're about to board the crew for this drop. You'll get access to the mission log and live activity."
            }
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-white py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 rounded-[4px] border-[3px] border-tok-black bg-tok-teal py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-60"
            >
              {isPending ? 'Processing…' : drop.isLocked ? 'Send Request' : 'Join Now'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function PageSkeleton() {
  return (
    <div className="relative min-h-screen bg-tok-cream font-inter text-[#1C1C1A]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 pb-24">
        <div className="mb-8 flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm bg-tok-black/15" />
          <Skeleton className="h-4 w-24 rounded-sm bg-tok-black/10" />
        </div>

        {/* Billboard — matches teal hero + pills + spark + title + meta + action row */}
        <section className="relative mb-10 overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-tok-teal p-6 shadow-[8px_8px_0px_#1C1C1A] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-tok-teal via-tok-teal/85 to-tok-teal/55" />
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Skeleton className="h-8 w-24 rounded-sm border-2 border-tok-black bg-amber-400/85 shadow-[2px_2px_0px_#1C1C1A] sm:h-10 sm:w-28" />
                  <Skeleton className="h-8 w-28 rounded-sm border-2 border-tok-black bg-emerald-400/75 shadow-[2px_2px_0px_#1C1C1A] sm:h-10 sm:w-36" />
                </div>
                <div className="shrink-0">
                  <Skeleton className="h-8 w-[60px] rounded-sm border-2 border-tok-black bg-tok-cream shadow-[3px_3px_0px_#1C1C1A] sm:h-10 sm:w-[80px]" />
                </div>
              </div>
              <Skeleton className="mb-3 h-[clamp(30px,6vw,68px)] max-w-3xl rounded-sm bg-tok-cream/35" />
              <Skeleton className="mb-2 h-[clamp(30px,6vw,68px)] max-w-2xl rounded-sm bg-tok-cream/28" />
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-4 w-4 rounded-sm bg-tok-cream/45" />
                  <Skeleton className="h-4 w-48 max-w-[70vw] rounded-sm bg-tok-cream/35" />
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-4 w-4 rounded-sm bg-tok-cream/45" />
                  <Skeleton className="h-4 w-40 max-w-[60vw] rounded-sm bg-tok-cream/35" />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
              <Skeleton className="h-12 min-w-[120px] flex-1 rounded-[4px] border-[3px] border-tok-black bg-white sm:flex-none sm:min-w-[132px]" />
              <Skeleton className="h-12 min-w-[104px] rounded-[4px] border-[3px] border-tok-black bg-tok-cream/55 sm:w-[112px]" />
              <SparkButtonSkeleton variant="hero" className="h-12" />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="order-2 min-w-0 lg:order-1">
            {/* Mission Overview */}
            <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A]">
              <Skeleton className="h-3 w-44 rounded-sm bg-tok-teal/30" />
              <div className="mt-3 space-y-2.5">
                <Skeleton className="h-4 w-full rounded-sm bg-tok-black/8" />
                <Skeleton className="h-4 w-full rounded-sm bg-tok-black/8" />
                <Skeleton className="h-4 max-w-xl rounded-sm bg-tok-black/8" />
              </div>
            </div>

            {/* Photo Roll strip */}
            <PhotoRollSkeleton />

            <CrewRosterSkeleton />
            <ActivityLedgerSkeleton />
          </div>

          {/* Digital ticket — QR + join code / URL blocks */}
          <aside className="order-1 hidden lg:order-2 lg:block lg:self-start">
            <DigitalTicketSkeleton />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DropDetailContent id={id} />
    </Suspense>
  );
}

function DropDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { dbUser, loading: authLoading, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !dbUser) {
      router.replace(`/login?redirectTo=${encodeURIComponent(`/drops/${id}`)}`);
    }
  }, [isReady, dbUser, router, id]);

  const { data: drop, isError } = useDrop(id);
  const {
    data: crewStatus,
    isLoading: isLoadingCrewStatus,
    status: crewQueryStatus,
  } = useMyCrewStatus(id, { enabled: Boolean(dbUser) });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberProfileSubject, setMemberProfileSubject] = useState<DropCrewProfileSubject | null>(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [logPage, setLogPage] = useState(1);
  const { mutate: leaveDrop, isPending: isLeaving } = useLeaveDrop(id);
  const { mutate: updatePresence, isPending: isUpdatingPresence } = useUpdatePresence(id);
  const { mutate: joinDrop, isPending: isJoining } = useJoinDrop(id);
  const isOrganiserCheck = Boolean(dbUser && drop && dbUser.id === drop.organiserId);
  const isCoChiefCheck = crewStatus?.memberRole === 'co_chief';
  const canManage = isOrganiserCheck || isCoChiefCheck;
  const canViewActivityLogs = canManage || crewStatus?.status === 'in';
  const { data: crew } = useDropCrew(id, { enabled: canViewActivityLogs });
  const { mutate: approveJoinRequest, isPending: isApproving, variables: approvingUserId } = useApproveJoinRequest(id);
  const { mutate: rejectJoinRequest, isPending: isRejecting, variables: rejectingUserId } = useRejectJoinRequest(id);
  const { mutate: removeCrewMember, isPending: isRemoving, variables: removingUserId } = useRemoveCrewMember(id);
  const { mutate: updateCrewRole, isPending: isUpdatingRole } = useUpdateCrewRole(id);

  const handleLeave = () => {
    leaveDrop(undefined, {
      onSuccess: () => {
        setLeaveModalOpen(false);
        toast.success('ABANDONED DROP SUCCESSFULLY');
        router.push('/drops');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'FAILED TO LEAVE DROP';
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleUpdatePresence = (isPresent: boolean) => {
    updatePresence(isPresent, {
      onSuccess: () => {
        toast.success(isPresent ? 'YOU TAPPED IN' : 'YOU TAPPED OUT');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'FAILED TO UPDATE ATTENDANCE';
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleApprove = (userId: string) => {
    approveJoinRequest(userId, {
      onSuccess: () => {
        toast.success('JOIN REQUEST APPROVED');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'FAILED TO APPROVE REQUEST';
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleReject = (userId: string) => {
    rejectJoinRequest(userId, {
      onSuccess: () => {
        toast.success('JOIN REQUEST REJECTED');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'FAILED TO REJECT REQUEST';
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    removeCrewMember(memberToRemove.userId, {
      onSuccess: () => {
        setRemoveModalOpen(false);
        setMemberToRemove(null);
        toast.success('CREW EJECTED FROM DROP');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'FAILED TO REMOVE MEMBER';
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleJoin = () => {
    if (!drop) return;
    const ageCheck = evaluateDropMinimumAgeEligibility(dbUser?.birthday, drop.minimumAge);
    if (!ageCheck.ok) {
      toast.error(ageCheck.message.toUpperCase());
      return;
    }
    joinDrop(undefined, {
      onSuccess: (data) => {
        setJoinModalOpen(false);
        if (data.status === 'pending') {
          toast.success('JOIN REQUEST SENT');
        } else {
          toast.success('JOINED CREW SUCCESSFULLY');
        }
      },
      onError: (err: unknown) => {
        toast.error(getJoinDropErrorMessage(err).toUpperCase());
      }
    });
  };

  const pendingMembers = crew?.filter((m) => m.status === 'pending') ?? [];

  if (!isReady || (authLoading && !dbUser)) return <PageSkeleton />;

  if (!dbUser) {
    return <PageSkeleton />;
  }

  if (!drop && !isError) return <PageSkeleton />;

  if (isError && !drop) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black">
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="rounded-[4px] border-[3px] border-tok-black bg-white p-8 shadow-[8px_8px_0px_#1C1C1A] sm:p-12">
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              System Error
            </p>
            <h2 className="mt-4 font-passion text-[clamp(28px,4vw,48px)] font-bold uppercase tracking-tight text-tok-black">
              Drop not found.
            </h2>
            <p className="mt-4 max-w-xl font-inter text-base leading-relaxed text-tok-black/60">
              This drop may have been purged, or the link provided is invalid. Check the join code and try again.
            </p>
            <Link
              href="/drops"
              className="mt-8 inline-flex items-center gap-2.5 rounded-[4px] border-[3px] border-tok-black bg-tok-teal px-6 py-3.5 font-passion text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
            >
              <IconArrowLeft size={16} strokeWidth={2.5} />
              Return to Board
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOrganiser = isOrganiserCheck;
  const isCompleted = drop.status === 'completed';
  const canEdit = isOrganiser && !isCompleted;
  const showGuestMissionPanels =
    !isOrganiser &&
    !isCompleted &&
    drop.isPublic &&
    crewQueryStatus === 'success' &&
    crewStatus?.status !== 'in';
  const hasDigitalTicketAccess = canManage || crewStatus?.status === 'in';

  return (
    <div className="min-h-screen bg-tok-cream font-inter text-[#1C1C1A] selection:bg-tok-teal/15">
      {/* Visual background flourishes */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 pb-24"
        >
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="group mb-6 inline-flex items-center gap-2.5 rounded-sm border-2 border-tok-black/10 bg-white/5 px-3 py-1.5 font-passion text-[10px] font-bold uppercase tracking-[2px] text-[#1C1C1A]/60 transition-all hover:border-tok-black hover:bg-white hover:text-tok-black hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:mb-8 sm:gap-3 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[2.5px]"
          >
            <IconArrowLeft size={14} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1" />
            Go Back
          </button>

          {/* Billboard Hero Section */}
          <section className="relative mb-10 overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-tok-teal p-6 shadow-[8px_8px_0px_#1C1C1A] sm:p-10 lg:p-12">
            {drop.coverPhoto && (
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src={coverPhotoSrcForNextImage(drop.coverPhoto)}
                  alt=""
                  fill
                  className="object-cover opacity-25"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-r from-tok-teal via-tok-teal/80 to-transparent" />
              </div>
            )}


            <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <StatusPill status={drop.status} scheduledAt={drop.scheduledAt} />
                  {drop.isPublic && (
                    <span className={cn(
                      "h-8 sm:h-10 inline-flex items-center gap-1.5 rounded-sm border-2 px-2 font-passion text-[10px] font-bold uppercase tracking-[1px] shadow-[2px_2px_0px_#1C1C1A] sm:gap-2 sm:px-3 sm:tracking-[1.5px]",
                      drop.isLocked
                        ? "border-tok-black bg-amber-400 text-tok-black"
                        : "border-tok-black bg-emerald-500 text-white"
                    )}>
                      {drop.isLocked ? (
                        <span className="inline-flex items-center gap-1.5">
                          <IconLock size={12} className="sm:hidden" />
                          <span className="hidden sm:inline pt-0.5">Approval Required</span>
                          <span className="sm:hidden pt-0.5">Locked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
                          <IconUserCheck size={12} className="sm:hidden" />
                          <span className="hidden sm:inline pt-0.5">Instant Join</span>
                          <span className="sm:hidden pt-0.5">Instant</span>
                        </span>
                      )}
                    </span>
                  )}
                  {drop.category === 'party' && drop.minimumAge != null && (
                    <span className="h-8 sm:h-10 inline-flex items-center gap-1.5 rounded-sm border-2 border-tok-black bg-tok-black/35 px-2 font-passion text-[10px] font-bold uppercase tracking-[1px] text-tok-cream shadow-[2px_2px_0px_#1C1C1A] backdrop-blur-[2px] sm:gap-2 sm:px-3 sm:tracking-[1.5px]">
                      <IconMartini size={12} strokeWidth={2.5} className="opacity-90" aria-hidden />
                      <span className="pt-0.5 [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
                        <span className="hidden sm:inline">Ages </span>{drop.minimumAge}+
                      </span>
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <SparkButton drop={drop} variant="hero" className="h-8 min-w-[60px] sm:h-10 sm:min-w-[70px]" />
                </div>
              </div>

              {/* Title & Actions Row — Split on Large Screens */}
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1">
                  <h1
                    className="wrap-break-word font-passion text-[clamp(32px,6vw,72px)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-tok-cream [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_2px_16px_rgba(0,0,0,0.35)]"
                  >
                    {drop.name}
                  </h1>
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2.5 text-tok-cream/92">
                      <IconCalendar size={16} className="shrink-0 text-tok-cream/70" strokeWidth={2.5} />
                      <span className="font-passion text-sm font-bold uppercase tracking-wider [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                        {formatDateTime(drop.scheduledAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-tok-cream/92">
                      <IconMapPin size={16} className="shrink-0 text-tok-cream/70" strokeWidth={2.5} />
                      <span className="font-passion text-sm font-bold uppercase tracking-wider [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                        {drop.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="group relative flex h-12 min-w-[100px] flex-1 items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-white px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:flex-none sm:px-6 lg:hidden"
                  >
                    <IconShare2 size={16} strokeWidth={2.5} />
                    <span className="pt-0.5">Share</span>
                  </button>
                  {/* Primary Action Button (Join/Request/Leave/Awaiting) */}
                  {!isOrganiser && !isCompleted && (
                    <div className="flex-1 sm:flex-none">
                      {crewStatus?.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => setLeaveModalOpen(true)}
                          className="group relative flex h-12 w-full min-w-[140px] items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-amber-400 px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:w-auto sm:px-6"
                        >
                          <IconClock size={16} strokeWidth={2.5} />
                          <span className="pt-0.5">Awaiting Approval</span>
                        </button>
                      ) : crewStatus?.status === 'in' ? (
                        <button
                          type="button"
                          onClick={() => setLeaveModalOpen(true)}
                          className="group relative flex h-12 w-full min-w-[120px] items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-red-500 px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:w-auto sm:px-6"
                        >
                          <IconLogOut size={16} strokeWidth={2.5} />
                          <span className="pt-0.5 text-nowrap">Leave Drop</span>
                        </button>
                      ) : drop.isPublic ? (
                        <button
                          type="button"
                          onClick={() => setJoinModalOpen(true)}
                          disabled={isJoining}
                          className="group relative flex h-12 w-full min-w-[140px] items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-tok-teal px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:w-auto sm:px-6"
                        >
                          {isJoining ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : drop.isLocked ? (
                            <>
                              <IconLock size={16} strokeWidth={2.5} />
                              <span className="pt-0.5">Request Join</span>
                            </>
                          ) : (
                            <>
                              <IconUserCheck size={16} strokeWidth={2.5} />
                              <span className="pt-0.5">Join Crew</span>
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  )}
                  {canEdit && (
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setEditModalOpen(true)}
                        className="group relative flex h-12 min-w-[120px] flex-1 items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-tok-cream px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:flex-none sm:px-6"
                      >
                        <IconEdit size={16} strokeWidth={2.5} />
                        <span className="pt-0.5 text-nowrap">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="group relative flex h-12 w-12 items-center justify-center rounded-[4px] border-[3px] border-tok-black bg-white text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A]"
                      >
                        <IconTrash size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="order-2 min-w-0 lg:order-1">
              {/* Mission Overview */}
              {drop.overview && (
                <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A]">
                  <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
                    Mission Overview
                  </p>
                  <p className="mt-4 font-inter text-base leading-relaxed text-tok-black/72 whitespace-pre-wrap">
                    {drop.overview}
                  </p>
                </div>
              )}

              {showGuestMissionPanels && crewStatus?.status === 'pending' && (
                <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-amber-400 p-6 shadow-[6px_6px_0px_#1C1C1A] sm:p-8">
                  <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-black/50">
                    Mission Boarding
                  </p>
                  <h3 className="mt-4 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black sm:text-3xl">
                    Request pending
                  </h3>
                  <p className="mt-3 max-w-xl font-inter text-sm leading-relaxed text-tok-black/70">
                    The chief still needs to approve your join request. You will get full crew access as soon as you are approved.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeaveModalOpen(true)}
                    className="mt-8 w-full rounded-[4px] border-[3px] border-tok-black bg-white py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none sm:w-auto sm:px-10"
                  >
                    Withdraw request
                  </button>
                </div>
              )}

              {showGuestMissionPanels && crewStatus?.status !== 'pending' && (
                <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-tok-teal-pale p-6 shadow-[6px_6px_0px_#1C1C1A] sm:p-8">
                  <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
                    Mission Boarding
                  </p>
                  <h3 className="mt-4 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black sm:text-3xl">
                    Ready to join the crew?
                  </h3>
                  <p className="mt-3 max-w-xl font-inter text-sm leading-relaxed text-tok-black/65">
                    {drop.isLocked
                      ? 'This mission is locked. Send a join request and the chief can approve you for access codes, attendance, and the live activity feed.'
                      : 'Board instantly to unlock your digital ticket, join codes, and the full mission toolkit for this drop.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(true)}
                    disabled={isJoining}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-tok-teal py-3.5 font-passion text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-60 sm:w-auto sm:px-10"
                  >
                    {isJoining ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : drop.isLocked ? (
                      <>
                        <IconLock size={16} strokeWidth={2.5} />
                        Request to join
                      </>
                    ) : (
                      <>
                        <IconUserCheck size={16} strokeWidth={2.5} />
                        Join the crew
                      </>
                    )}
                  </button>
                </div>
              )}

              {showGuestMissionPanels && (
                <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A] sm:p-8">
                  <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
                    Mission Protocol
                  </p>
                  <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="rounded-sm border-2 border-tok-black/10 bg-tok-cream/20 p-4">
                      <dt className="flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/45">
                        <IconShieldCheck size={14} strokeWidth={2.5} className="text-tok-teal" aria-hidden />
                        Entry status
                      </dt>
                      <dd className="mt-2 font-passion text-lg font-bold uppercase tracking-tight text-tok-black">
                        {crewStatus?.status === 'pending' ? 'Awaiting authorization' : 'Not boarded'}
                      </dd>
                    </div>
                    <div className="rounded-sm border-2 border-tok-black/10 bg-tok-cream/20 p-4">
                      <dt className="flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/45">
                        <IconLock size={14} strokeWidth={2.5} className="text-tok-teal" aria-hidden />
                        Authorization
                      </dt>
                      <dd className="mt-2 font-passion text-lg font-bold uppercase tracking-tight text-tok-black">
                        {drop.isLocked ? 'Chief approval' : 'Open boarding'}
                      </dd>
                    </div>
                    <div className="rounded-sm border-2 border-tok-black/10 bg-tok-cream/20 p-4">
                      <dt className="flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/45">
                        <IconMapPin size={14} strokeWidth={2.5} className="text-tok-teal" aria-hidden />
                        Location intel
                      </dt>
                      <dd className="mt-2 font-inter text-sm font-semibold leading-snug text-tok-black/80">
                        {drop.location}
                      </dd>
                    </div>
                    <div className="rounded-sm border-2 border-tok-black/10 bg-tok-cream/20 p-4">
                      <dt className="flex items-center gap-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/45">
                        <IconCalendar size={14} strokeWidth={2.5} className="text-tok-teal" aria-hidden />
                        Timeframe
                      </dt>
                      <dd className="mt-2 font-passion text-lg font-bold uppercase tracking-tight text-tok-black">
                        {formatDateTime(drop.scheduledAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {canManage && !isCompleted && pendingMembers.length > 0 && (
                <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-amber-400 p-1 shadow-[6px_6px_0px_#1C1C1A]">
                  <div className="bg-amber-400 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconClock size={16} strokeWidth={2.5} className="text-tok-black" />
                        <h2 className="font-passion text-lg font-bold uppercase tracking-tight text-tok-black">
                          Join Requests ({pendingMembers.length})
                        </h2>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {pendingMembers.map((member) => (
                      <div key={member.id} className="flex flex-col gap-4 bg-white p-6 sm:flex-row sm:items-center">
                        <div className="flex flex-1 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-amber-400 font-passion text-sm font-bold text-tok-black">
                            {member.user.avatar ? (
                              <Image src={member.user.avatar} alt="" width={44} height={44} className="h-full w-full object-cover" />
                            ) : (
                              getLogInitials(member.user.firstName, member.user.lastName)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="font-inter text-xs font-medium text-tok-black/50">
                              Requested {formatLogTime(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReject(member.userId)}
                            disabled={(isRejecting && rejectingUserId === member.userId) || (isApproving && approvingUserId === member.userId)}
                            className="h-10 flex-1 rounded-[4px] border-2 border-tok-black bg-white px-4 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-red-600 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(member.userId)}
                            disabled={(isApproving && approvingUserId === member.userId) || (isRejecting && rejectingUserId === member.userId)}
                            className="h-10 flex-1 rounded-[4px] border-2 border-tok-black bg-tok-teal px-4 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-white hover:bg-tok-teal/90 disabled:opacity-50 sm:flex-none"
                          >
                            {isApproving && approvingUserId === member.userId ? '…' : 'Approve'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos — accessible to crew */}
              <PhotoRoll
                drop={drop}
                userId={dbUser?.id}
                isOrganiser={canManage}
                isCrewMember={(crewStatus?.status as string) === 'in'}
                isLoadingStatus={isLoadingCrewStatus}
              />

              {/* Drop Supplies — always visible to organiser and crew, collapses when empty */}
              {(canManage || crewStatus?.status === 'in') && (
                <DropSuppliesAccordion
                  drop={drop}
                  isOrganiser={canManage}
                  isCrewMember={crewStatus?.status === 'in'}
                  currentUser={dbUser ?? undefined}
                  activeCrew={crew?.filter(m => m.status === 'in') ?? []}
                />
              )}

              {/* Crew — visible to members or the organiser (tap in/out lives in this card) */}
              {(canManage || (crewStatus?.status as string) === 'in') && (
                <CrewRoster
                  dropId={id}
                  organiserId={drop.organiserId}
                  organiser={drop.organiser}
                  dropCreatedAt={drop.createdAt}
                  isOrganiser={canManage}
                  isOriginalChief={isOrganiser}
                  currentUserId={dbUser?.id}
                  isCompleted={isCompleted}
                  onRemoveMember={(userId, name) => {
                    setMemberToRemove({ userId, name });
                    setRemoveModalOpen(true);
                  }}
                  isRemoving={isRemoving}
                  removingUserId={removingUserId ?? null}
                  isUpdatingRole={isUpdatingRole}
                  updatingUserId={memberProfileSubject?.kind === 'crew' ? memberProfileSubject.member.userId : null}
                  onUpdateRole={(userId, newRole) => {
                    updateCrewRole(
                      { userId, role: newRole },
                      {
                        onSuccess: () => {
                          toast.success(`CREW ROLE UPDATED TO ${newRole.toUpperCase().replace('_', '-')}`);
                        },
                        onError: (err: unknown) => {
                          const msg = err instanceof Error ? err.message : 'FAILED TO UPDATE ROLE';
                          toast.error(msg.toUpperCase());
                        },
                      }
                    );
                  }}
                  myPresence={
                    crewStatus?.status === 'in' && !isCompleted
                      ? {
                        isPresent: Boolean(crewStatus.isPresent),
                        onTapIn: () => handleUpdatePresence(true),
                        onTapOut: () => handleUpdatePresence(false),
                        isPending: isUpdatingPresence,
                      }
                      : undefined
                  }
                  onOpenMemberProfile={(member) => {
                    if (member.userId === drop.organiserId) {
                      setMemberProfileSubject({ kind: 'organiser', profile: drop.organiser });
                    } else {
                      setMemberProfileSubject({ kind: 'crew', member });
                    }
                  }}
                />
              )}

              {/* Activity Ledger — only for crew/organiser */}
              {canViewActivityLogs && (
                <ActivityLedger
                  dropId={id}
                  page={logPage}
                  setPage={setLogPage}
                />
              )}
            </div>

            {/* Sidebar — Ticket & Join Codes */}
            <aside
              className={cn(
                'order-1 flex flex-col gap-8 lg:order-2 lg:self-start',
                !hasDigitalTicketAccess && 'flex-col-reverse',
              )}
            >
              <DigitalTicket
                drop={drop}
                isMember={hasDigitalTicketAccess}
                className="hidden w-full lg:block"
              />

              {/* Drop command / chief card — desktop only (mobile: tap crew roster rows) */}
              <div className="hidden lg:block rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A]">
                <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
                  Drop command
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal-pale shadow-[3px_3px_0px_#1C1C1A]">
                    {drop.organiser?.avatar ? (
                      <Image
                        src={drop.organiser.avatar}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-passion text-xl text-tok-teal">
                        {drop.organiser?.firstName?.[0]}{drop.organiser?.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black/40">
                      Drop chief
                    </p>
                    <h4 className="truncate font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
                      {drop.organiser?.firstName} {drop.organiser?.lastName}
                    </h4>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between rounded-sm border-2 border-tok-black bg-tok-cream/30 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-tok-teal text-white">
                        <IconUsers size={16} strokeWidth={2.5} />
                      </div>
                      <span className="font-passion text-xs font-bold uppercase tracking-wider text-tok-black">Total Crew</span>
                    </div>
                    <span className="font-passion text-xl font-bold text-tok-teal">{drop.organiser.crewReached || 0}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-sm border-2 border-tok-black bg-tok-cream/30 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-400 text-tok-black">
                        <IconMartini size={16} strokeWidth={2.5} />
                      </div>
                      <span className="font-passion text-xs font-bold uppercase tracking-wider text-tok-black">Total Drops</span>
                    </div>
                    <span className="font-passion text-xl font-bold text-tok-black">{drop.organiser.dropCount || 0}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMemberProfileSubject({ kind: 'organiser', profile: drop.organiser })}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm border-[3px] border-tok-black bg-white py-3 font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-black transition-all hover:-translate-y-1 hover:bg-tok-cream/50 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
                >
                  View Chief Profile
                </button>
              </div>
            </aside>
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {editModalOpen && (
          <DropModal
            drop={drop}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => setEditModalOpen(false)}
          />
        )}
        {shareModalOpen && (
          <DropShareModal
            drop={drop}
            onClose={() => setShareModalOpen(false)}
          />
        )}
        {leaveModalOpen && (
          <LeaveConfirmModal
            dropName={drop.name}
            onConfirm={handleLeave}
            onClose={() => setLeaveModalOpen(false)}
            isPending={isLeaving}
          />
        )}
        {joinModalOpen && (
          <JoinConfirmModal
            drop={drop}
            onConfirm={handleJoin}
            onClose={() => setJoinModalOpen(false)}
            isPending={isJoining}
          />
        )}
        {deleteModalOpen && (
          <DeleteDropModal
            drop={drop}
            onClose={(deleted) => {
              setDeleteModalOpen(false);
              if (deleted) {
                router.push('/drops');
              }
            }}
          />
        )}
        {memberProfileSubject && (
          <DropCrewProfileModal
            subject={memberProfileSubject}
            onClose={() => setMemberProfileSubject(null)}
            isOriginalChief={isOrganiser}
            isUpdatingRole={isUpdatingRole}
            onUpdateRole={(newRole) => {
              if (memberProfileSubject.kind !== 'crew') return;
              updateCrewRole(
                { userId: memberProfileSubject.member.userId, role: newRole },
                {
                  onSuccess: () => {
                    toast.success(`MEMBER ROLE UPDATED TO ${newRole.toUpperCase().replace('_', '-')}`);
                    setMemberProfileSubject(null);
                  },
                  onError: (err: unknown) => {
                    const msg = err instanceof Error ? err.message : 'FAILED TO UPDATE ROLE';
                    toast.error(msg.toUpperCase());
                  },
                }
              );
            }}
          />
        )}
        {removeModalOpen && memberToRemove && (
          <RemoveMemberConfirmModal
            memberName={memberToRemove.name}
            onConfirm={handleRemoveMember}
            onClose={() => {
              setRemoveModalOpen(false);
              setMemberToRemove(null);
            }}
            isPending={isRemoving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
