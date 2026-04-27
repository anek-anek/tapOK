'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  ClipboardCopy,
  Clock3,
  Edit3,
  LogIn,
  MapPin,
  Plus,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { CreateDropModal, EditDropModal } from '@/components/drop-modal';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyDrops } from '@/hooks/queries/use-drops';
import type { Drop, DropStatus } from '@/types/drop';

type StatusMeta = {
  label: string;
  tone: string;
  dot: string;
};

const STATUS_META: Record<DropStatus, StatusMeta> = {
  active: {
    label: 'Active',
    tone: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  ongoing: {
    label: 'Ongoing',
    tone: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    tone: 'bg-[#2a2118]/6 text-[#2a2118]/46 border-[#2a2118]/10',
    dot: 'bg-[#2a2118]/36',
  },
};

const STATUS_STRIPE: Record<DropStatus, string> = {
  active: 'border-l-[#006666]',
  ongoing: 'border-l-[#c47b10]',
  completed: 'border-l-[#2a2118]/18',
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function sortUpcoming(a: Drop, b: Drop) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

function sortRecent(a: Drop, b: Drop) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function formatRelativeTime(iso: string) {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);

  if (!Number.isFinite(diffMinutes)) {
    return 'Recently';
  }

  if (Math.abs(diffMinutes) < 1) {
    return 'Just now';
  }

  if (Math.abs(diffMinutes) < 60) {
    return `${Math.abs(diffMinutes)}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)}d ago`;
}

function getRole(drop: Drop, userId?: string | null) {
  return userId && drop.organiserId === userId ? 'Chief' : 'Crew';
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'D';
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-syne text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#2a2118]/64">
          {description}
        </p>
      ) : null}
    </div>
  );
}


function StatusPill({ status }: { status: DropStatus }) {
  const meta = STATUS_META[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-syne text-[9px] font-bold uppercase tracking-[2.1px] ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ShareModal({ drop, onClose }: { drop: Drop; onClose: () => void }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(drop.shareUrl); } catch { return; }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleCopyCode = async () => {
    try { await navigator.clipboard.writeText(drop.joinCode); } catch { return; }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-[#2a2118]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-[28px] border border-[#2a2118]/10 bg-[#F7E9B2] p-6 shadow-[0_32px_80px_rgba(42,33,24,0.22)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">Share drop</p>
            <h3 className="mt-1 truncate font-syne text-[18px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              {drop.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2118]/10 text-[#2a2118]/40 transition-colors hover:border-[#2a2118]/20 hover:text-[#2a2118]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex justify-center rounded-[20px] bg-white p-5">
          <QRCodeSVG value={drop.shareUrl} size={180} bgColor="#ffffff" fgColor="#2a2118" level="M" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <div>
            <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">Join code</p>
            <p className="mt-0.5 font-syne text-[24px] font-bold tracking-[0.18em] text-[#2a2118]">{drop.joinCode}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedCode ? <CheckCheck size={12} /> : <ClipboardCopy size={12} />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[#2a2118]/10 bg-white/72 px-4 py-3">
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#2a2118]/46">{drop.shareUrl}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/56 transition-colors hover:text-[#2a2118]"
          >
            {copiedLink ? <CheckCheck size={12} /> : <ClipboardCopy size={12} />}
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompactDropCard({
  drop,
  viewerId,
  onShare,
  onEdit,
}: {
  drop: Drop;
  viewerId?: string | null;
  onShare: (drop: Drop) => void;
  onEdit: (drop: Drop) => void;
}) {
  const canEdit = drop.status !== 'completed';

  return (
    <article className={`group rounded-[22px] border border-l-[5px] ${STATUS_STRIPE[drop.status]} border-[#2a2118]/10 bg-white/70 p-4 shadow-[0_10px_28px_rgba(42,33,24,0.05)] transition-transform duration-200 hover:-translate-y-0.5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={drop.status} />
            <span className="font-syne text-[9px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/30">
              {drop.joinCode}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[12px] font-bold tracking-[0.12em] text-[#F7E9B2]">
              {getInitials(drop.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-semibold leading-tight text-[#2a2118]">
                {drop.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-[#2a2118]/56">
                {getRole(drop, viewerId)} view
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-[13px] text-[#2a2118]/64 sm:grid-cols-3">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-[#2a2118]/40" />
              {formatDateTime(drop.scheduledAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-[#2a2118]/40" />
              <span className="truncate">{drop.location}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} className="text-[#2a2118]/40" />
              {drop.expectedHeadcount ? `${drop.expectedHeadcount} expected` : 'Headcount not set'}
            </span>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#2a2118]/46">
            <Clock3 size={12} className="text-[#2a2118]/34" />
            Updated {formatRelativeTime(drop.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href={`/drops/${drop.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/12 bg-[#F7E9B2] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118] transition-colors hover:bg-[#FFF2C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Open
            <ArrowUpRight size={13} />
          </Link>
          {canEdit ? (
            <button
              type="button"
              onClick={() => onEdit(drop)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 transition-colors hover:border-[#2a2118]/18 hover:text-[#2a2118] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Edit3 size={13} />
              Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onShare(drop)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/80 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 transition-colors hover:border-[#2a2118]/18 hover:text-[#2a2118] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <ClipboardCopy size={13} />
            Share
          </button>
        </div>
      </div>
    </article>
  );
}

function FocusDropCard({
  drop,
  onShare,
}: {
  drop: Drop;
  onShare: (drop: Drop) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#2a2118]/10 bg-[linear-gradient(180deg,rgba(255,249,229,0.98),rgba(255,244,212,0.9))] p-5 shadow-[0_18px_44px_rgba(42,33,24,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006666] font-syne text-[12px] font-bold tracking-[0.12em] text-[#F7E9B2]">
            {getInitials(drop.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-syne text-[20px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
              {drop.name}
            </h2>
            <div className="mt-1.5">
              <StatusPill status={drop.status} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href={`/drops/${drop.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/12 bg-[#006666] px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#F7E9B2] transition-colors hover:bg-[#006666]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2"
          >
            Open
            <ArrowRight size={13} />
          </Link>
          <button
            type="button"
            onClick={() => onShare(drop)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2118]/10 bg-white/75 px-4 py-2 font-syne text-[10px] font-bold uppercase tracking-[2.1px] text-[#2a2118]/56 transition-colors hover:border-[#2a2118]/18 hover:text-[#2a2118] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2"
          >
            <ClipboardCopy size={13} />
            Share
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#2a2118]/8 pt-4 text-[13px] text-[#2a2118]/64">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} className="text-[#2a2118]/40" />
          {formatDateTime(drop.scheduledAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} className="text-[#2a2118]/40" />
          <span className="truncate">{drop.location}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} className="text-[#2a2118]/40" />
          {drop.organiser.firstName} {drop.organiser.lastName}
        </span>
        {drop.expectedHeadcount ? (
          <span className="inline-flex items-center gap-1.5">
            <Ticket size={13} className="text-[#2a2118]/40" />
            {drop.expectedHeadcount} expected
          </span>
        ) : null}
      </div>
    </div>
  );
}

function GateCard() {
  return (
    <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/72 p-7 shadow-[0_14px_40px_rgba(42,33,24,0.06)]">
      <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
        Authentication required
      </p>
      <h2 className="mt-3 font-syne text-[clamp(28px,3.8vw,44px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
        Sign in to manage or join a Drop.
      </h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#006666] px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-[#006666]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <LogIn size={14} />
          Log in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2118]/10 bg-white/75 px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118] transition-colors hover:border-[#2a2118]/18 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ onCreateDrop }: { onCreateDrop: () => void }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#2a2118]/14 bg-white/60 p-7 shadow-[0_14px_40px_rgba(42,33,24,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006666]/10 text-[#006666]">
        <Plus size={22} />
      </div>
      <h2 className="mt-4 font-syne text-[22px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
        No Drops yet
      </h2>
      <p className="mt-3 max-w-lg text-[14px] leading-7 text-[#2a2118]/64">
        Create the first plan and TapOk will generate the link, QR, and join code the
        moment it goes live.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCreateDrop}
          className="inline-flex items-center gap-2 rounded-full bg-[#006666] px-5 py-3 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-[#006666]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Plus size={14} />
          Create drop
        </button>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[180px] rounded-[28px] border border-[#2a2118]/10 bg-white/55 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[150px] rounded-[22px] border border-[#2a2118]/10 bg-white/55 animate-pulse" />
        <div className="h-[150px] rounded-[22px] border border-[#2a2118]/10 bg-white/55 animate-pulse" />
      </div>
    </div>
  );
}

export default function DropsPage() {
  const router = useRouter();
  const { user, dbUser, loading } = useAuth();
  const { data: drops = [], isLoading, isError } = useMyDrops({
    enabled: Boolean(user) && !loading,
  });
  const [shareModalDrop, setShareModalDrop] = useState<Drop | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDrop, setEditDrop] = useState<Drop | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'completed'>('live');

  const sortedUpcoming = useMemo(
    () => [...drops].sort(sortUpcoming),
    [drops],
  );
  const activeDrops = useMemo(
    () => sortedUpcoming.filter((drop) => drop.status === 'active' || drop.status === 'ongoing'),
    [sortedUpcoming],
  );
  const completedDrops = useMemo(
    () => [...drops].filter((drop) => drop.status === 'completed').sort(sortRecent),
    [drops],
  );
  const focusDrop = activeDrops[0] ?? sortedUpcoming[0] ?? null;

  const liveTabDrops = useMemo(
    () =>
      focusDrop && (focusDrop.status === 'active' || focusDrop.status === 'ongoing')
        ? activeDrops.filter((d) => d.id !== focusDrop.id)
        : activeDrops,
    [activeDrops, focusDrop],
  );

  const plannedHeadcount = drops.reduce((sum, drop) => sum + (drop.expectedHeadcount ?? 0), 0);
  const handleShare = (drop: Drop) => setShareModalDrop(drop);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    router.push(`/drops/join/${code}`);
  };

  const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleJoin();
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-6 py-10 lg:px-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
            <SectionTitle
              eyebrow="Drops"
              title="One Drop. One Crew."
              description="TapOk is where a plan becomes real. Sign in to create a Drop, join a Crew, and keep the log in one place."
            />
            <GateCard />
          </div>
        </main>
      </div>
    );
  }

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

      <main className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="flex flex-col justify-center gap-4">
            <div>
              <h1 className="font-syne text-[clamp(32px,4.2vw,60px)] font-bold uppercase tracking-[-0.04em] text-[#2a2118]">
                Your Drops
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[#2a2118]/56">
                Plan the meetup. Share the drop. Live the moment.
              </p>
            </div>
            {drops.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2118]/10 bg-white/70 px-3 py-1.5 text-[13px]">
                  <Users size={13} className="text-[#006666]" />
                  <span className="font-semibold text-[#2a2118]">{plannedHeadcount}</span>
                  <span className="text-[#2a2118]/52">crew reached</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2118]/10 bg-white/70 px-3 py-1.5 text-[13px]">
                  <CalendarDays size={13} className="text-[#006666]" />
                  <span className="font-semibold text-[#2a2118]">{drops.length}</span>
                  <span className="text-[#2a2118]/52">{drops.length === 1 ? 'drop' : 'drops'} created</span>
                </div>
                {activeDrops.length > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[13px]">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-semibold text-emerald-800">{activeDrops.length}</span>
                    <span className="text-emerald-700/70">live now</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-[#2a2118]/10 bg-[linear-gradient(135deg,rgba(255,249,229,0.96),rgba(255,241,196,0.78))] p-5 shadow-[0_14px_34px_rgba(42,33,24,0.06)]">
            <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
              Quick actions
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="group flex w-full items-center justify-between rounded-[20px] bg-[#006666] px-5 py-4 transition-colors hover:bg-[#006666]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2"
              >
                <div>
                  <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2]/50">Create</p>
                  <p className="mt-0.5 font-syne text-[16px] font-bold uppercase tracking-[-0.02em] text-[#F7E9B2]">New Drop</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7E9B2]/15 transition-transform group-hover:scale-105">
                  <Plus size={16} className="text-[#F7E9B2]" />
                </div>
              </button>
              <div className="rounded-[20px] border border-[#2a2118]/10 bg-white/72 p-4">
                <p className="font-syne text-[9px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">Got a code?</p>
                <form onSubmit={handleJoinSubmit} className="mt-3 flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                    className="h-10 min-w-0 flex-1 rounded-full border border-[#2a2118]/10 bg-white/90 px-4 font-syne text-[11px] font-bold tracking-[2.2px] text-[#2a2118] placeholder:text-[#2a2118]/24 outline-none transition-colors focus:border-[#006666]/35"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center rounded-full bg-[#2a2118] px-4 font-syne text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-[#2a2118]/90"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
            {isLoading ? (
              <BoardSkeleton />
            ) : isError ? (
              <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/72 p-6 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
                <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
                  Something slipped
                </p>
                <h2 className="mt-3 font-syne text-[24px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
                  We could not load your Drops.
                </h2>
                <p className="mt-3 max-w-xl text-[14px] leading-7 text-[#2a2118]/64">
                  Try again in a moment. Your session may need a refresh if this keeps
                  happening.
                </p>
              </div>
            ) : drops.length === 0 ? (
              <EmptyState onCreateDrop={() => setCreateModalOpen(true)} />
            ) : (
              <>
                {activeTab === 'live' && focusDrop && focusDrop.status !== 'completed' && (
                  <FocusDropCard
                    drop={focusDrop}
                    onShare={handleShare}
                  />
                )}

                <div className={`rounded-[28px] border border-[#2a2118]/10 p-5 shadow-[0_12px_34px_rgba(42,33,24,0.05)] transition-colors duration-300 ${activeTab === 'completed' ? 'bg-white/48' : 'bg-white/58'}`}>
                  <div className="flex border-b border-[#2a2118]/8">
                    <button
                      type="button"
                      onClick={() => setActiveTab('live')}
                      className={`relative flex items-center gap-2 pb-3 pr-6 font-syne text-[11px] font-bold uppercase tracking-[2.1px] transition-colors focus-visible:outline-none ${
                        activeTab === 'live' ? 'text-[#2a2118]' : 'text-[#2a2118]/38 hover:text-[#2a2118]/70'
                      }`}
                    >
                      <span className="relative">
                        Live
                        {activeDrops.length > 0 && activeTab !== 'live' && (
                          <span className="absolute -right-2 -top-0.5 flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${activeTab === 'live' ? 'bg-[#2a2118]/8 text-[#2a2118]' : 'bg-[#2a2118]/6 text-[#2a2118]/36'}`}>
                        {activeDrops.length}
                      </span>
                      {activeTab === 'live' && (
                        <span className="absolute bottom-0 left-0 right-6 h-[2px] rounded-full bg-[#006666]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('completed')}
                      className={`relative flex items-center gap-2 pb-3 pr-6 font-syne text-[11px] font-bold uppercase tracking-[2.1px] transition-colors focus-visible:outline-none ${
                        activeTab === 'completed' ? 'text-[#2a2118]' : 'text-[#2a2118]/38 hover:text-[#2a2118]/70'
                      }`}
                    >
                      Completed
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${activeTab === 'completed' ? 'bg-[#2a2118]/8 text-[#2a2118]' : 'bg-[#2a2118]/6 text-[#2a2118]/36'}`}>
                        {completedDrops.length}
                      </span>
                      {activeTab === 'completed' && (
                        <span className="absolute bottom-0 left-0 right-6 h-[2px] rounded-full bg-[#006666]" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {activeTab === 'live' ? (
                      liveTabDrops.length > 0 ? (
                        liveTabDrops.map((drop) => (
                          <CompactDropCard key={drop.id} drop={drop} viewerId={dbUser?.id} onShare={handleShare} onEdit={setEditDrop} />
                        ))
                      ) : focusDrop && focusDrop.status !== 'completed' ? (
                        <p className="py-3 text-center font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/28">
                          Only one live drop — featured above
                        </p>
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#2a2118]/14 bg-white/65 p-5 text-center">
                          <p className="font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                            Nothing live right now
                          </p>
                          <p className="mt-2 text-[13px] leading-6 text-[#2a2118]/58">
                            Create the next Drop and it will appear here as soon as it goes active.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className={completedDrops.length > 0 ? 'space-y-3 opacity-80' : undefined}>
                        {completedDrops.length > 0 ? (
                          completedDrops.map((drop) => (
                            <CompactDropCard key={drop.id} drop={drop} viewerId={dbUser?.id} onShare={handleShare} onEdit={setEditDrop} />
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-[#2a2118]/14 bg-white/65 p-5 text-center">
                            <p className="font-syne text-[11px] font-bold uppercase tracking-[2.2px] text-[#2a2118]/34">
                              No completed Drops yet
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-[#2a2118]/58">
                              Finished plans will collect here with their logs and share links.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
        </section>
      </main>

      {shareModalDrop && (
        <ShareModal drop={shareModalDrop} onClose={() => setShareModalDrop(null)} />
      )}
      {createModalOpen && (
        <CreateDropModal onClose={() => setCreateModalOpen(false)} />
      )}
      {editDrop && (
        <EditDropModal drop={editDrop} onClose={() => setEditDrop(null)} />
      )}
    </div>
  );
}
