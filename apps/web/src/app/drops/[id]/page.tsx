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
  ClipboardCopy as IconClipboard,
  Ticket as IconTicket,
} from 'lucide-react';
import { useDrop } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { TapokNavbar } from '@/components/tapok-navbar';
import { EditDropModal } from '@/components/drop-modal';
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

function ShareModal({
  drop,
  onClose,
}: {
  drop: { name: string; shareUrl: string; joinCode: string };
  onClose: () => void;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(drop.shareUrl);
    } catch {
      return;
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(drop.joinCode);
    } catch {
      return;
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-[28px] border border-[#2a2118]/10 bg-[#F7E9B2] p-6 shadow-[0_32px_80px_rgba(42,33,24,0.22)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
              Share drop
            </p>
            <h3 className="mt-1 truncate font-syne text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              {drop.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/10 text-[#2a2118]/40 transition-colors hover:border-[#2a2118]/20 hover:text-[#2a2118]"
          >
            <IconX size={14} />
          </button>
        </div>

        <div className="flex justify-center rounded-[20px] bg-white p-5">
          <QRCodeSVG value={drop.shareUrl} size={180} bgColor="#ffffff" fgColor="#2a2118" level="M" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <div>
            <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
              Join code
            </p>
            <p className="mt-0.5 font-syne text-[24px] font-bold tracking-[0.18em] text-[#2a2118]">
              {drop.joinCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedCode ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#2a2118]/46">
            {drop.shareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedLink ? <IconCheckCheck size={12} /> : <IconClipboard size={12} />}
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
      <TapokNavbar active="drops" />
      <main className="relative mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-6 h-4 w-20 animate-pulse rounded-full bg-[#2a2118]/10" />
        <div className="mb-8 flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[#2a2118]/10" />
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded-full bg-[#2a2118]/10" />
            <div className="h-7 w-52 animate-pulse rounded bg-[#2a2118]/10" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
            <div className="h-64 animate-pulse rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
          </div>
          <div className="h-80 animate-pulse rounded-[28px] border border-[#2a2118]/10 bg-white/55" />
        </div>
      </main>
    </div>
  );
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { dbUser } = useAuth();
  const { data: drop, isLoading, isError } = useDrop(id);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (isError || !drop) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
        <TapokNavbar active="drops" />
        <main className="relative mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
          <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/72 p-8 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
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

      <TapokNavbar active="drops" />

      <main className="relative mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        {/* Back */}
        <Link
          href="/drops"
          className="mb-6 inline-flex items-center gap-2 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
        >
          <IconArrowLeft size={13} />
          Drops
        </Link>

        {/* Hero */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[14px] font-bold tracking-[0.1em] text-[#F7E9B2]">
              {getInitials(drop.name)}
            </div>
            <div>
              <StatusPill status={drop.status} />
              <h1 className="mt-1.5 font-syne text-[clamp(22px,3.2vw,36px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
                {drop.name}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/75 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 transition-colors hover:border-[#2a2118]/18 hover:text-[#2a2118]"
            >
              <IconShare2 size={13} />
              Share
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/12 bg-[#F7E9B2] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118] transition-colors hover:bg-[#FFF2C7]"
              >
                <IconEdit size={13} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-4">
            {/* Details card */}
            <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 p-6 shadow-[0_10px_28px_rgba(42,33,24,0.06)]">
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
                  <span>
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
              </div>
            </div>

            {/* Activity log */}
            <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.06)] overflow-hidden">
              <div className="flex items-center gap-2 px-6 pt-5 pb-4">
                <IconActivity size={13} className="text-[#006666]" />
                <p className="font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
                  Activity
                </p>
              </div>

              {!drop.activityLogs || drop.activityLogs.length === 0 ? (
                <div className="border-t border-[#2a2118]/[0.06] px-6 py-6 text-center">
                  <p className="font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                    No activity yet
                  </p>
                </div>
              ) : (
                drop.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 border-t border-[#2a2118]/[0.06] px-6 py-4 hover:bg-[#2a2118]/[0.015] transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006666]/12 font-syne text-[10px] font-extrabold tracking-[0.5px] text-[#006666]">
                      {getLogInitials(log.user.firstName, log.user.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-[1.4] text-[#2a2118]/72">
                        <strong className="font-semibold text-[#2a2118]">
                          {log.user.firstName} {log.user.lastName}
                        </strong>{' '}
                        {log.action === 'created' ? 'created this drop' : 'updated this drop'}
                        {log.changedFields && Object.keys(log.changedFields).length > 0 && (
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
          <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 p-6 shadow-[0_10px_28px_rgba(42,33,24,0.06)] lg:self-start">
            <p className="mb-4 font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/36">
              Share
            </p>

            <div className="flex justify-center rounded-[20px] bg-[#F7E9B2]/60 p-5">
              <QRCodeSVG value={drop.shareUrl} size={160} bgColor="transparent" fgColor="#2a2118" level="M" />
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
                  {drop.shareUrl}
                </span>
                <CopyButton text={drop.shareUrl} />
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
        <ShareModal drop={drop} onClose={() => setShareModalOpen(false)} />
      )}
      {editModalOpen && (
        <EditDropModal drop={drop} onClose={() => setEditModalOpen(false)} />
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
