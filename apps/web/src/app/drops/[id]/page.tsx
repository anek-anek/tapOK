'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft as IconArrowLeft,
  Calendar as IconCalendar,
  MapPin as IconMapPin,
  Users as IconUsers,
  Copy as IconCopy,
  CheckCheck as IconCheckCheck,
  Share2 as IconShare2,
  Edit3 as IconEdit,
  Trash2 as IconTrash,
  Activity as IconActivity,
  X as IconX,
  Ticket as IconTicket,
  LogOut as IconLogOut,
} from 'lucide-react';
import {
  CheckCircle2 as IconCheckCircle,
  Clock as IconClock,
  UserCheck as IconUserCheck,
  UserX as IconUserX,
  Ban as IconBan,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  Lock as IconLock,
} from 'lucide-react';
import { useDrop, useMyCrewStatus, useDropCrew, useDropActivityLogs } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { TapokNavbar } from '@/components/tapok-navbar';
import { DropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { DeleteDropModal } from '@/components/drops/DeleteDropModal';
import { DigitalTicket } from '@/components/drops/DigitalTicket';
import { PhotoRoll } from '@/components/drops/PhotoRoll';
import { ModalShell } from '@/components/modal-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaveDrop, useApproveJoinRequest, useRejectJoinRequest, useRemoveCrewMember, useUpdatePresence, useJoinDrop } from '@/hooks/mutations/use-drop-mutations';
import { SparkButton } from '@/components/drops/spark-button';
import { toast } from 'react-hot-toast';
import type { DropStatus } from '@/types/drop';
import { cn } from '@/lib/utils';

const STATUS_META: Record<DropStatus, { label: string; tone: string; dot: string; pulse: boolean }> = {
  active: {
    label: 'Live Now',
    tone: 'bg-emerald-500 text-white border-black',
    dot: 'bg-white',
    pulse: true,
  },
  ongoing: {
    label: 'Ongoing',
    tone: 'bg-amber-400 text-black border-black',
    dot: 'bg-black',
    pulse: false,
  },
  completed: {
    label: 'Finished',
    tone: 'bg-[#1C1C1A]/10 text-[#1C1C1A]/40 border-[#1C1C1A]/10',
    dot: 'bg-[#1C1C1A]/20',
    pulse: false,
  },
};

function StatusPill({ status }: { status: DropStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-sm border-2 px-3 py-1 font-passion text-[10px] font-bold uppercase tracking-[1.5px] shadow-[2px_2px_0px_#1C1C1A] ${meta.tone}`}>
      {meta.pulse ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`} />
        </span>
      ) : (
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      )}
      {meta.label}
    </span>
  );
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
              Expel Member
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
              {isPending ? 'Removing…' : 'Remove Member'}
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
    <div className="min-h-screen bg-tok-cream text-[#1C1C1A]">
      <TapokNavbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <Skeleton className="mb-8 h-4 w-32 rounded-sm bg-black/5" />

        {/* Billboard Skeleton */}
        <div className="mb-10 rounded-[4px] border-[3px] border-tok-black/10 bg-tok-teal/10 p-6 sm:p-10 lg:p-12 shadow-[8px_8px_0px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-32 rounded-sm bg-black/10" />
              <Skeleton className="h-16 w-3/4 rounded-sm bg-black/5 sm:h-20" />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-40 rounded-sm bg-black/10" />
                <Skeleton className="h-4 w-40 rounded-sm bg-black/10" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32 rounded-sm bg-black/5 border-[3px] border-black/5" />
              <Skeleton className="h-12 w-32 rounded-sm bg-black/5 border-[3px] border-black/5" />
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            {/* Presence Placeholder */}
            <div className="rounded-[4px] border-[3px] border-tok-black/5 bg-white p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 rounded-sm bg-black/10" />
                  <Skeleton className="h-6 w-56 rounded-sm bg-black/5" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-28 rounded-sm bg-black/5 border-[3px] border-black/5" />
                  <Skeleton className="h-12 w-28 rounded-sm bg-black/5 border-[3px] border-black/5" />
                </div>
              </div>
            </div>

            {/* Log Placeholder */}
            <div className="rounded-[4px] border-[3px] border-tok-black/10 bg-white shadow-[6px_6px_0px_rgba(0,0,0,0.05)]">
              <div className="border-b-[3px] border-black/5 bg-black/5 px-6 py-5">
                <Skeleton className="h-6 w-40 rounded-sm bg-black/10" />
              </div>
              <div className="divide-y divide-black/5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-5 px-6 py-5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-sm bg-black/5 border-2 border-black/5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3 rounded-sm bg-black/5" />
                      <Skeleton className="h-2 w-24 rounded-sm bg-black/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Placeholder */}
          <div className="hidden lg:block space-y-6">
            <Skeleton className="h-[520px] rounded-[4px] border-[3px] border-tok-black/10 bg-white/40 shadow-[6px_6px_0px_rgba(0,0,0,0.05)]" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const mounted = useMounted();
  const { dbUser, loading: authLoading, isReady } = useAuth();
  const { data: drop, isLoading, isFetched, isError } = useDrop(id);

  // Robust loading state using isFetched
  const isHardLoading = !isFetched || (isLoading && !drop);

  const { data: crewStatus } = useMyCrewStatus(id, { enabled: Boolean(dbUser) });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [logPage, setLogPage] = useState(1);
  const { mutate: leaveDrop, isPending: isLeaving } = useLeaveDrop(id);
  const { mutate: updatePresence, isPending: isUpdatingPresence } = useUpdatePresence(id);
  const { mutate: joinDrop, isPending: isJoining } = useJoinDrop(id);

  const isOrganiserCheck = Boolean(dbUser && drop && dbUser.id === drop.organiserId);
  const canViewActivityLogs = isOrganiserCheck || crewStatus?.status === 'in';
  const { data: crew } = useDropCrew(id, { enabled: isOrganiserCheck || crewStatus?.status === 'in' });
  const { data: activityPage, isFetching: isLoadingLogs } = useDropActivityLogs(id, logPage, {
    enabled: canViewActivityLogs,
  });
  const { mutate: approveJoinRequest, isPending: isApproving, variables: approvingUserId } = useApproveJoinRequest(id);
  const { mutate: rejectJoinRequest, isPending: isRejecting, variables: rejectingUserId } = useRejectJoinRequest(id);
  const { mutate: removeCrewMember, isPending: isRemoving, variables: removingUserId } = useRemoveCrewMember(id);

  const handleLeave = () => {
    leaveDrop(undefined, {
      onSuccess: () => {
        setLeaveModalOpen(false);
        toast.success('ABANDONED DROP SUCCESSFULLY');
        router.push('/drops');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO LEAVE DROP';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleUpdatePresence = (isPresent: boolean) => {
    updatePresence(isPresent, {
      onSuccess: () => {
        toast.success(isPresent ? 'YOU TAPPED IN' : 'YOU TAPPED OUT');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO UPDATE ATTENDANCE';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleApprove = (userId: string) => {
    approveJoinRequest(userId, {
      onSuccess: () => {
        toast.success('JOIN REQUEST APPROVED');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO APPROVE REQUEST';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleReject = (userId: string) => {
    rejectJoinRequest(userId, {
      onSuccess: () => {
        toast.success('JOIN REQUEST REJECTED');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO REJECT REQUEST';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
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
        toast.success('MEMBER REMOVED FROM CREW');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO REMOVE MEMBER';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const handleJoin = () => {
    joinDrop(undefined, {
      onSuccess: (data) => {
        setJoinModalOpen(false);
        if (data.status === 'pending') {
          toast.success('JOIN REQUEST SENT');
        } else {
          toast.success('JOINED CREW SUCCESSFULLY');
        }
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO JOIN DROP';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  };

  const pendingMembers = crew?.filter((m) => m.status === 'pending') ?? [];
  const activeMembers = React.useMemo(() => {
    if (!crew || !drop) return [];
    const members = crew.filter((m) => m.status === 'in');
    return [...members].sort((a, b) => {
      if (a.userId === drop.organiserId) return -1;
      if (b.userId === drop.organiserId) return 1;
      return 0;
    });
  }, [crew, drop]);

  if (!mounted || !isReady || (authLoading && !dbUser) || isHardLoading) return <PageSkeleton />;

  if (isError || !drop) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black">
        <TapokNavbar />
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
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/drops/join/${drop.joinCode}` : drop.shareUrl;

  return (
    <div className="min-h-screen bg-tok-cream font-inter text-[#1C1C1A] selection:bg-tok-teal/15">
      {/* Visual background flourishes */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <TapokNavbar />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 pb-24">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-[#1C1C1A]/40 transition-colors hover:text-[#1C1C1A]"
        >
          <IconArrowLeft size={14} strokeWidth={2.5} />
          Go Back
        </button>

        {/* Billboard Hero Section */}
        <section className="relative mb-10 overflow-hidden rounded-[4px] border-[3px] border-tok-black bg-tok-teal p-6 shadow-[8px_8px_0px_#1C1C1A] sm:p-10 lg:p-12">
          {drop.coverPhoto && (
            <div className="pointer-events-none absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={drop.coverPhoto} alt="" className="h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-linear-to-r from-tok-teal via-tok-teal/80 to-transparent" />
            </div>
          )}

          {/* Absolute Top-Right Actions */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-3 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
            <SparkButton drop={drop} variant="hero" />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <StatusPill status={drop.status} />
                <span className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-cream/40">
                  CODE: {drop.joinCode}
                </span>
                {drop.isPublic && (
                  <span className={cn(
                    "rounded-sm border-2 px-2 py-0.5 font-passion text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
                    drop.isLocked
                      ? "border-amber-400 bg-amber-400 text-black"
                      : "border-emerald-400 bg-emerald-400 text-white"
                  )}>
                    {drop.isLocked ? "Approval Required" : "Instant Join"}
                  </span>
                )}
              </div>
              <h1 className="break-words font-passion text-[clamp(32px,6vw,72px)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-[#F7E9B2]">
                {drop.name}
              </h1>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex items-center gap-2.5 text-[#F7E9B2]/70">
                  <IconCalendar size={16} className="text-[#F7E9B2]/40" strokeWidth={2.5} />
                  <span className="font-passion text-sm font-bold uppercase tracking-wider">{formatDateTime(drop.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#F7E9B2]/70">
                  <IconMapPin size={16} className="text-[#F7E9B2]/40" strokeWidth={2.5} />
                  <span className="font-passion text-sm font-bold uppercase tracking-wider">{drop.location}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="group relative flex h-12 min-w-[100px] flex-1 items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-white px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:flex-none sm:px-6"
                >
                  <IconShare2 size={16} strokeWidth={2.5} />
                  <span className="pt-0.5">Share</span>
                </button>
              )}
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
                    className="group relative flex h-12 min-w-[120px] flex-1 items-center justify-center gap-2 rounded-[4px] border-[3px] border-tok-black bg-[#F7E9B2] px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-black transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:flex-none sm:px-6"
                  >
                    <IconEdit size={16} strokeWidth={2.5} />
                    <span className="pt-0.5 text-nowrap">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-[4px] border-[3px] border-tok-black bg-white px-3 font-passion text-xs font-bold uppercase tracking-[2px] text-red-500 transition-transform active:translate-y-0 active:translate-x-0 active:shadow-none hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#1C1C1A] sm:flex-none"
                    title="Delete Drop"
                  >
                    <IconTrash size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Big decorative background initials */}
          <div className="pointer-events-none absolute -bottom-10 -right-4 z-0 font-passion text-[180px] font-bold leading-none text-[#F7E9B2]/5 opacity-20 select-none">
            {getInitials(drop.name)}
          </div>
        </section>

        {/* Content Grid */}
        <div className={`grid gap-8 ${!isCompleted ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
          {/* Left: Ledger & Activity */}
          <div className="order-2 min-w-0 lg:order-1">
            {/* Drop Overview */}
            {drop.overview && (
              <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A]">
                <p className="font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                  Mission Overview
                </p>
                <div className="mt-3 font-inter text-sm leading-relaxed text-tok-black/80 whitespace-pre-wrap">
                  {drop.overview}
                </div>
              </div>
            )}

            {/* Presence / Quick Action for Crew */}
            {!isOrganiser && crewStatus?.status === 'in' && !isCompleted && (
              <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white p-6 shadow-[6px_6px_0px_#1C1C1A]">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div>
                    <p className="font-passion text-[11px] font-bold uppercase tracking-[2.5px] text-tok-teal">
                      Your Attendance
                    </p>
                    <h3 className="mt-1 font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                      Are you hitting this drop?
                    </h3>
                  </div>
                  <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      disabled={isUpdatingPresence || crewStatus?.isPresent === true}
                      onClick={() => handleUpdatePresence(true)}
                      className={`h-12 w-full min-w-[120px] rounded-[4px] border-[3px] border-tok-black font-passion text-xs font-bold uppercase tracking-[2px] transition-all sm:w-auto ${crewStatus?.isPresent
                        ? 'bg-tok-teal text-white shadow-[3px_3px_0px_#1C1C1A]'
                        : 'bg-white text-tok-black/30 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] hover:text-tok-black'
                        }`}
                    >
                      {crewStatus?.isPresent ? 'I am In ✓' : 'Tap In'}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingPresence || crewStatus?.isPresent === false}
                      onClick={() => handleUpdatePresence(false)}
                      className={`h-12 w-full min-w-[120px] rounded-[4px] border-[3px] border-tok-black font-passion text-xs font-bold uppercase tracking-[2px] transition-all sm:w-auto ${!crewStatus?.isPresent
                        ? 'bg-red-500 text-white shadow-[3px_3px_0px_#1C1C1A]'
                        : 'bg-white text-tok-black/30 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] hover:text-tok-black'
                        }`}
                    >
                      {!crewStatus?.isPresent ? 'I am Out ✓' : 'Tap Out'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Approvals */}
            {isOrganiser && !isCompleted && pendingMembers.length > 0 && (
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
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-amber-400 font-passion text-sm font-bold text-tok-black">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
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
                          {isApproving && approvingUserId === member.userId ? '...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Roll */}
            <div className="mb-10">
              <PhotoRoll
                drop={drop}
                userId={dbUser?.id}
                isOrganiser={isOrganiser}
                isCrewMember={crewStatus?.status === 'in'}
              />
            </div>

            {/* Crew Roster */}
            {(isOrganiser || crewStatus?.status === 'in') && activeMembers.length > 0 && (
              <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]">
                <div className="border-b-[3px] border-tok-black bg-tok-teal/5 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconUsers size={18} strokeWidth={2.5} className="text-tok-teal" />
                      <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                        The Crew
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm border-2 border-tok-black bg-emerald-500 px-2.5 py-0.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white">
                        {activeMembers.filter((m) => m.isPresent).length} In
                      </span>
                      <span className="rounded-sm border-2 border-tok-black bg-red-500 px-2.5 py-0.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white">
                        {activeMembers.filter((m) => !m.isPresent).length} Out
                      </span>
                    </div>
                  </div>
                </div>
                <div className="divide-y-2 divide-tok-black/5">
                  {activeMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-tok-teal/2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal font-passion text-sm font-bold text-[#F7E9B2]">
                        {member.user.avatar ? (
                          <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getLogInitials(member.user.firstName, member.user.lastName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-passion text-lg font-bold uppercase tracking-tight text-tok-black sm:text-xl">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          {member.userId === drop.organiserId && (
                            <span className="inline-flex items-center rounded-sm bg-tok-black px-2 py-0.5 font-passion text-[9px] font-bold tracking-[1.5px] text-tok-yellow">
                              CHIEF
                            </span>
                          )}
                        </div>
                        <p className="font-inter text-xs text-tok-black/40">
                          Joined {formatLogTime(member.joinedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={cn(
                          "rounded-full px-4 py-1.5 font-passion text-[11px] font-bold uppercase tracking-[1.5px] border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A]",
                          member.isPresent ? "bg-emerald-500 text-white" : "bg-white text-red-500"
                        )}>
                          {member.isPresent ? 'TAPPED IN' : 'TAPPED OUT'}
                        </span>
                        {!isCompleted && isOrganiser && (
                          <button
                            type="button"
                            onClick={() => {
                              setMemberToRemove({ userId: member.userId, name: `${member.user.firstName} ${member.user.lastName}` });
                              setRemoveModalOpen(true);
                            }}
                            disabled={isRemoving && removingUserId === member.userId}
                            className="flex h-8 w-8 items-center justify-center text-tok-black/20 transition-colors hover:text-red-500 disabled:opacity-50"
                            title="Remove from crew"
                          >
                            <IconUserX size={16} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Ledger */}
            {canViewActivityLogs && (
              <div className="rounded-[4px] border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] sm:shadow-[6px_6px_0px_#1C1C1A]">
                <div className="border-b-[3px] border-tok-black bg-tok-teal/8 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <IconActivity size={18} strokeWidth={2.5} className="text-tok-teal" />
                      <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black">
                        Drop Log
                      </h2>
                    </div>
                    {activityPage && activityPage.total > 0 && (
                      <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30">
                        {activityPage.total} entries
                      </span>
                    )}
                  </div>
                </div>

                {isLoadingLogs && !activityPage ? (
                  <div className="divide-y divide-tok-black/5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-5 px-6 py-5">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-sm bg-black/5 border-2 border-black/5" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3 rounded-sm bg-black/5" />
                          <Skeleton className="h-2 w-24 rounded-sm bg-black/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !activityPage || activityPage.data.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="font-passion text-sm font-bold uppercase tracking-[3px] text-black/20">
                      Quiet on the deck
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`divide-y divide-tok-black/5 transition-opacity ${isLoadingLogs ? 'opacity-50' : 'opacity-100'}`}>
                      {activityPage.data.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-5 px-4 py-5 transition-colors hover:bg-tok-teal/1 sm:px-6"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black bg-tok-teal/10 font-passion text-[10px] font-bold text-tok-teal">
                            {log.user.avatar ? (
                              <img src={log.user.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              getLogInitials(log.user.firstName, log.user.lastName)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-inter text-sm leading-relaxed text-tok-black/80">
                              <span className="truncate font-passion text-sm font-bold uppercase tracking-tight text-tok-black sm:text-base">
                                {log.user.firstName} {log.user.lastName}
                              </span>
                              {' '}
                              <span className="font-medium">
                                {{
                                  created: 'initiated the drop',
                                  joined: 'boarded the crew',
                                  join_requested: 'sent a join request',
                                  join_request_approved: 'cleared a join request',
                                  join_request_rejected: 'denied a join request',
                                  left: 'abandoned ship',
                                  updated: 'modified the plan',
                                  member_removed: 'ejected a crew member',
                                  marked_in: 'tapped IN',
                                  marked_out: 'tapped OUT',
                                  marked_ongoing: 'pushed the drop LIVE',
                                  marked_completed: 'closed the mission',
                                }[log.action] ?? log.action.replace(/_/g, ' ')}
                              </span>
                              {log.action === 'updated' && log.changedFields && Object.keys(log.changedFields).length > 0 && (
                                <span className="block mt-1 font-mono text-[10px] text-tok-black/40">
                                  FIELDS: {Object.keys(log.changedFields).join(', ').toUpperCase()}
                                </span>
                              )}
                            </p>
                            <p className="mt-2 font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30">
                              {formatLogTime(log.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {activityPage.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t-[3px] border-tok-black px-4 py-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => setLogPage((p) => p - 1)}
                          disabled={logPage === 1 || isLoadingLogs}
                          className="flex items-center gap-1.5 rounded-[4px] border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                          <IconChevronLeft size={12} strokeWidth={2.5} />
                          Prev
                        </button>
                        <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                          {logPage} / {activityPage.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogPage((p) => p + 1)}
                          disabled={logPage === activityPage.totalPages || isLoadingLogs}
                          className="flex items-center gap-1.5 rounded-[4px] border-2 border-tok-black bg-white px-3 py-2 font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                          Next
                          <IconChevronRight size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Digital Ticket Sidebar (Desktop Only, hidden when completed) */}
          {!isCompleted && (
            <aside className="order-1 hidden lg:block lg:order-2 lg:self-start">
              <DigitalTicket drop={drop} />
            </aside>
          )}
        </div>
      </main>

      {shareModalOpen && (
        <DropShareModal drop={drop} onClose={() => setShareModalOpen(false)} />
      )}
      {canEdit && editModalOpen && (
        <DropModal drop={drop} onClose={() => setEditModalOpen(false)} />
      )}
      {canEdit && deleteModalOpen && (
        <DeleteDropModal
          drop={drop}
          onClose={(deleted) => {
            setDeleteModalOpen(false);
            if (deleted) router.push('/drops');
          }}
        />
      )}
      {leaveModalOpen && (
        <LeaveConfirmModal
          dropName={drop.name}
          isPending={isLeaving}
          onConfirm={handleLeave}
          onClose={() => setLeaveModalOpen(false)}
        />
      )}
      {joinModalOpen && (
        <JoinConfirmModal
          drop={drop}
          isPending={isJoining}
          onConfirm={handleJoin}
          onClose={() => setJoinModalOpen(false)}
        />
      )}
      {removeModalOpen && memberToRemove && (
        <RemoveMemberConfirmModal
          memberName={memberToRemove.name}
          isPending={isRemoving}
          onConfirm={handleRemoveMember}
          onClose={() => {
            setRemoveModalOpen(false);
            setMemberToRemove(null);
          }}
        />
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('LINK COPIED TO CLIPBOARD');
    } catch {
      return;
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 py-1.5 font-passion text-[10px] font-bold uppercase tracking-[1px] text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
    >
      {copied ? <IconCheckCheck size={14} strokeWidth={2.5} /> : <IconCopy size={14} strokeWidth={2.5} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
