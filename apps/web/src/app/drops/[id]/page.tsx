'use client';

import React, { useEffect, useState } from 'react';
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
  Activity as IconActivity,
  X as IconX,
  Ticket as IconTicket,
  LogOut as IconLogOut,
} from 'lucide-react';
import {
  CheckCircle2 as IconCheckCircle,
  Clock as IconClock,
} from 'lucide-react';
import { useDrop, useMyCrewStatus } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { TapokNavbar } from '@/components/tapok-navbar';
import { EditDropModal } from '@/components/drop-modal';
import { DropShareModal } from '@/components/drops/DropShareModal';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import { useLeaveDrop } from '@/hooks/mutations/use-drop-mutations';
import type { DropStatus } from '@/types/drop';

const STATUS_META: Record<DropStatus, { label: string; tone: string; dot: string; pulse: boolean }> = {
  active: {
    label: 'Active',
    tone: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    dot: 'bg-emerald-500',
    pulse: true,
  },
  ongoing: {
    label: 'Ongoing',
    tone: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    dot: 'bg-amber-500',
    pulse: false,
  },
  completed: {
    label: 'Completed',
    tone: 'bg-[#2a2118]/6 text-[#2a2118]/46 border-[#2a2118]/10',
    dot: 'bg-[#2a2118]/36',
    pulse: false,
  },
};

function StatusPill({ status }: { status: DropStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-syne text-[9px] font-bold uppercase tracking-[2.1px] ${meta.tone}`}>
      {meta.pulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${meta.dot}`} />
        </span>
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isPending]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-t-[28px] border border-[#2a2118]/10 bg-[#F7E9B2] p-5 shadow-[0_32px_80px_rgba(42,33,24,0.22)] sm:rounded-[28px] sm:p-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-red-600">
            Leave drop
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/10 text-[#2a2118]/40 transition-colors hover:border-[#2a2118]/20 hover:text-[#2a2118] disabled:opacity-40"
          >
            <IconX size={14} />
          </button>
        </div>
        <h3 className="mt-1 font-syne text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
          Are you sure?
        </h3>
        <p className="mt-2 text-[13px] leading-6 text-[#2a2118]/64">
          You&apos;ll be removed from{' '}
          <span className="font-semibold text-[#2a2118]">{dropName}</span> and lose
          access immediately. You can rejoin later using the join code.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-[18px] border border-[#2a2118]/12 bg-white/70 py-3 font-syne text-[10px] font-bold uppercase tracking-[2px] text-[#2a2118] transition-colors hover:bg-white/90 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-[18px] bg-red-600 py-3 font-syne text-[10px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? 'Leaving…' : 'Leave drop'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
      <TapokNavbar />
      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <Skeleton className="mb-6 h-4 w-20 rounded-full bg-[#2a2118]/10" />
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full bg-[#2a2118]/10" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded-full bg-[#2a2118]/10" />
            <Skeleton className="h-7 w-52 rounded bg-[#2a2118]/10" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Skeleton className="h-44 rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
            <Skeleton className="h-64 rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
          </div>
          <Skeleton className="h-80 rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
        </div>
      </main>
    </div>
  );
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const mounted = useMounted();
  const { dbUser } = useAuth();
  const { data: drop, isLoading, isError } = useDrop(id);
  const { data: crewStatus } = useMyCrewStatus(id, { enabled: Boolean(dbUser) });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const { mutate: leaveDrop, isPending: isLeaving } = useLeaveDrop(id);

  if (!mounted || isLoading) return <PageSkeleton />;

  if (isError || !drop) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
        <TapokNavbar />
        <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="rounded-[24px] border border-[#2a2118]/10 bg-white/72 p-5 shadow-[0_14px_40px_rgba(42,33,24,0.05)] sm:rounded-[28px] sm:p-8">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
              Not found
            </p>
            <h2 className="mt-3 font-syne text-[24px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              We could not find this Drop.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-7 text-[#2a2118]/64">
              It may have been removed or the link is incorrect.
            </p>
            <Link
              href="/drops"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#006666] px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-[#006666]/90"
            >
              <IconArrowLeft size={13} />
              Back to Drops
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOrganiser = dbUser?.id === drop.organiserId;
  const canEdit = isOrganiser && drop.status !== 'completed';
  const canLeave = !isOrganiser && (crewStatus?.status === 'in' || crewStatus?.status === 'pending');
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/drops/join/${drop.joinCode}` : drop.shareUrl;

  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(0,102,102,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(42,33,24,0.08),transparent_28%)]" />

      <TapokNavbar />

      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {/* Back */}
        <Link
          href="/drops"
          className="mb-6 inline-flex items-center gap-2 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
        >
          <IconArrowLeft size={13} />
          Drops
        </Link>

        {/* Hero */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[13px] font-bold tracking-[0.1em] text-[#F7E9B2] sm:h-14 sm:w-14 sm:text-[14px]">
              {getInitials(drop.name)}
            </div>
            <div className="min-w-0">
              <StatusPill status={drop.status} />
              <h1 className="mt-1.5 font-syne text-[clamp(22px,3.2vw,36px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
                {drop.name}
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/75 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 transition-colors hover:border-[#2a2118]/18 hover:text-[#2a2118] sm:flex-none"
            >
              <IconShare2 size={13} />
              Share
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#2a2118]/12 bg-[#F7E9B2] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118] transition-colors hover:bg-[#FFF2C7] sm:flex-none"
              >
                <IconEdit size={13} />
                Edit
              </button>
            )}
            {canLeave && (
              <button
                type="button"
                onClick={() => setLeaveModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-red-600 transition-colors hover:bg-red-100 sm:flex-none"
              >
                <IconLogOut size={13} />
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-4">
            {/* Details card */}
            <div className="rounded-[24px] border border-[#2a2118]/10 bg-white/70 p-4 shadow-[0_10px_28px_rgba(42,33,24,0.06)] sm:rounded-[28px] sm:p-6">
              <p className="mb-4 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
                Drop details
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-[14px] text-[#2a2118]/72">
                  <IconCalendar size={14} className="shrink-0 text-[#2a2118]/36" />
                  {formatDateTime(drop.scheduledAt)}
                </div>
                <div className="flex items-center gap-3 text-[14px] text-[#2a2118]/72">
                  <IconMapPin size={14} className="shrink-0 text-[#2a2118]/36" />
                  {drop.location}
                </div>
                {drop.expectedHeadcount && (
                  <div className="flex items-center gap-3 text-[14px] text-[#2a2118]/72">
                    <IconTicket size={14} className="shrink-0 text-[#2a2118]/36" />
                    {drop.expectedHeadcount} expected
                  </div>
                )}
                <div className="flex items-center gap-3 text-[14px] text-[#2a2118]/72">
                  <IconUsers size={14} className="shrink-0 text-[#2a2118]/36" />
                  <span className="min-w-0 break-words">
                    Organised by{' '}
                    <span className="font-semibold text-[#2a2118]">
                      {drop.organiser.firstName} {drop.organiser.lastName}
                    </span>
                    {isOrganiser && (
                      <span className="ml-1.5 inline-flex items-center rounded-full border border-[#006666]/20 bg-[#006666]/10 px-2 py-0.5 font-syne text-[8px] font-bold uppercase tracking-[1.5px] text-[#006666]">
                        You
                      </span>
                    )}
                  </span>
                </div>
                {!isOrganiser && crewStatus?.status === 'in' && (
                  <div className="flex items-center gap-2">
                    <IconCheckCircle size={14} className="shrink-0 text-[#006666]" />
                    <span className="inline-flex items-center rounded-full border border-[#006666]/20 bg-[#006666]/10 px-2.5 py-0.5 font-syne text-[9px] font-bold uppercase tracking-[1.5px] text-[#006666]">
                      You&apos;re In
                    </span>
                  </div>
                )}
                {!isOrganiser && crewStatus?.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <IconClock size={14} className="shrink-0 text-amber-700" />
                    <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-100/80 px-2.5 py-0.5 font-syne text-[9px] font-bold uppercase tracking-[1.5px] text-amber-700">
                      Awaiting Approval
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity log */}
            <div className="overflow-hidden rounded-[24px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.06)] sm:rounded-[28px]">
              <div className="flex items-center gap-2 px-4 pb-4 pt-5 sm:px-6">
                <IconActivity size={13} className="text-[#006666]" />
                <p className="font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
                  Activity
                </p>
              </div>

              {!drop.activityLogs || drop.activityLogs.length === 0 ? (
                <div className="border-t border-[#2a2118]/[0.06] px-4 py-6 text-center sm:px-6">
                  <p className="font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                    No activity yet
                  </p>
                </div>
              ) : (
                drop.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 border-t border-[#2a2118]/[0.06] px-4 py-4 transition-colors hover:bg-[#2a2118]/[0.015] sm:items-center sm:gap-4 sm:px-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006666]/12 font-syne text-[10px] font-extrabold tracking-[0.5px] text-[#006666]">
                      {getLogInitials(log.user.firstName, log.user.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-[1.4] text-[#2a2118]/72">
                        <strong className="font-semibold text-[#2a2118]">
                          {log.user.firstName} {log.user.lastName}
                        </strong>{' '}
                        {log.action === 'created' && 'created this drop'}
                        {log.action === 'updated' && 'updated this drop'}
                        {log.action === 'joined' && 'joined this drop'}
                        {log.action === 'join_requested' && 'requested to join this drop'}
                        {log.action === 'left' && 'left this drop'}
                        {log.action === 'updated' && log.changedFields && Object.keys(log.changedFields).length > 0 && (
                          <span className="text-[#2a2118]/40">
                            {' '}
                            ({Object.keys(log.changedFields).join(', ')})
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-[#2a2118]/40">
                        {formatLogTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column — Share */}
          <div className="rounded-[24px] border border-[#2a2118]/10 bg-white/70 p-4 shadow-[0_10px_28px_rgba(42,33,24,0.06)] sm:rounded-[28px] sm:p-6 lg:self-start">
            <p className="mb-4 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
              Share
            </p>

            <div className="flex justify-center rounded-[20px] bg-[#F7E9B2]/60 p-5">
              <QRCodeSVG value={shareUrl} size={160} bgColor="transparent" fgColor="#2a2118" level="M" />
            </div>

            <div className="mt-3 rounded-[18px] border border-[#2a2118]/10 bg-[#F7E9B2]/50 px-4 py-3">
              <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                Join code
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-syne text-[22px] font-bold tracking-[0.18em] text-[#2a2118]">
                  {drop.joinCode}
                </p>
                <CopyButton text={drop.joinCode} />
              </div>
            </div>

            <div className="mt-2 rounded-[18px] border border-[#2a2118]/10 bg-[#F7E9B2]/50 px-4 py-3">
              <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                Share link
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#2a2118]/46">
                  {shareUrl}
                </span>
                <CopyButton text={shareUrl} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#006666] py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-[#006666]/90"
            >
              <IconShare2 size={13} />
              Share drop
            </button>
          </div>
        </div>
      </main>

      {shareModalOpen && (
        <DropShareModal drop={drop} onClose={() => setShareModalOpen(false)} />
      )}
      {editModalOpen && (
        <EditDropModal drop={drop} onClose={() => setEditModalOpen(false)} />
      )}
      {leaveModalOpen && (
        <LeaveConfirmModal
          dropName={drop.name}
          isPending={isLeaving}
          onConfirm={() => leaveDrop(undefined, { onSuccess: () => setLeaveModalOpen(false) })}
          onClose={() => setLeaveModalOpen(false)}
        />
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
    >
      {copied ? <IconCheckCheck size={12} /> : <IconCopy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
