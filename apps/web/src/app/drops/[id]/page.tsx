'use client';

import React, { useState } from 'react';
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
  Edit as IconEdit,
  Clock as IconClock,
  Activity as IconActivity,
} from 'lucide-react';
import { useDrop } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import type { DropStatus } from '@/types/drop';

const STATUS_STYLES: Record<DropStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  ongoing: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  completed: 'bg-[#2a2118]/8 text-[#2a2118]/40 border-[#2a2118]/12',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { dbUser } = useAuth();
  const { data: drop, isLoading, isError } = useDrop(id);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!drop) return;
    void navigator.clipboard.writeText(drop.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EDECE8] px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-[#2a2118]/8" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-[#2a2118]/8" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-[#2a2118]/8" />
        </div>
      </div>
    );
  }

  if (isError || !drop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDECE8]">
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#2a2118]/60">Drop not found.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs text-[#2a2118]/40 underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const isOrganiser = dbUser?.id === drop.organiserId;
  const canEdit = isOrganiser && drop.status !== 'completed';

  return (
    <div className="min-h-screen bg-[#EDECE8] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
        >
          <IconArrowLeft size={14} />
          Back
        </Link>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[drop.status]}`}
              >
                {drop.status}
              </span>
            </div>
            <h1 className="font-mono text-3xl font-bold text-[#2a2118]">{drop.name}</h1>
          </div>
          {canEdit && (
            <Link
              href={`/drops/${id}/edit`}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-[#2a2118]/15 bg-[#EDECE8]/60 px-4 py-2 font-mono text-xs text-[#2a2118]/55 transition-all hover:border-[#2a2118]/25 hover:bg-[#EDECE8] hover:text-[#2a2118]"
            >
              <IconEdit size={13} />
              Edit
            </Link>
          )}
        </div>

        {/* Details card */}
        <div className="mb-4 rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IconCalendar size={14} className="shrink-0 text-[#2a2118]/40" />
              <span className="font-mono text-sm text-[#2a2118]/70">{formatDateTime(drop.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <IconMapPin size={14} className="shrink-0 text-[#2a2118]/40" />
              <span className="font-mono text-sm text-[#2a2118]/70">{drop.location}</span>
            </div>
            {drop.expectedHeadcount && (
              <div className="flex items-center gap-3">
                <IconUsers size={14} className="shrink-0 text-[#2a2118]/40" />
                <span className="font-mono text-sm text-[#2a2118]/70">{drop.expectedHeadcount} expected</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-[#2a2118]/8 pt-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[#2a2118]/30">Organiser</p>
            <p className="mt-1 font-mono text-sm text-[#2a2118]/70">
              {drop.organiser.firstName} {drop.organiser.lastName}
            </p>
          </div>
        </div>

        {/* Share card */}
        <div className="mb-4 rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <IconShare2 size={14} className="text-[#2a2118]/40" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#2a2118]/30">Share</span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <p className="mb-2 font-mono text-xs text-[#2a2118]/40">Join code</p>
              <code className="mb-3 block rounded-lg bg-[#EDECE8] px-3 py-2 font-mono text-lg font-bold tracking-[0.25em] text-[#2a2118]">
                {drop.joinCode}
              </code>
              <p className="mb-1 font-mono text-xs text-[#2a2118]/40">Share link</p>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate rounded-lg border border-[#2a2118]/12 bg-[#EDECE8] px-3 py-2 font-mono text-xs text-[#2a2118]/60">
                  {drop.shareUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2a2118]/15 bg-[#EDECE8]/60 px-3 py-2 font-mono text-xs text-[#2a2118]/55 transition-all hover:border-[#2a2118]/25 hover:text-[#2a2118]"
                >
                  {copied ? <IconCheckCheck size={13} /> : <IconCopy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="rounded-lg border border-[#2a2118]/8 bg-white p-3">
                <QRCodeSVG value={drop.shareUrl} size={160} />
              </div>
              <p className="font-mono text-[10px] text-[#2a2118]/30">Scan to join</p>
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <IconActivity size={14} className="text-[#2a2118]/40" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#2a2118]/30">Activity</span>
          </div>
          {!drop.activityLogs || drop.activityLogs.length === 0 ? (
            <p className="font-mono text-xs text-[#2a2118]/30">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {drop.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <IconClock size={12} className="mt-0.5 shrink-0 text-[#2a2118]/25" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-[#2a2118]/70">
                      <span className="font-semibold">{log.user.firstName} {log.user.lastName}</span>
                      {' '}{log.action === 'created' ? 'created this drop' : 'updated this drop'}
                      {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                        <span className="text-[#2a2118]/40">
                          {' '}({Object.keys(log.changedFields).join(', ')})
                        </span>
                      )}
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] text-[#2a2118]/30">{formatLogTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
