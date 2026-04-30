'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';
import { TapokNavbar } from '@/components/tapok-navbar';
import { ActivePanel } from './_components/active-panel';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyActivity } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';
import type { DropActivityLog } from '@/types/drop';

// ── helpers ──────────────────────────────────────────────────────────────────

type AvatarStyle = 'teal' | 'dark' | 'pale' | 'muted';

const avatarCls: Record<AvatarStyle, string> = {
  teal:  'bg-tok-teal text-[#F7E9B2]',
  dark:  'bg-[#2a2118] text-[#F7E9B2]',
  pale:  'bg-tok-teal/12 text-tok-teal',
  muted: 'bg-[#2a2118]/10 text-[#2a2118]/46',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
}

function pickAvatarStyle(index: number): AvatarStyle {
  const styles: AvatarStyle[] = ['teal', 'pale', 'muted', 'dark'];
  return styles[index % styles.length]!;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (!Number.isFinite(diffMin) || diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hrs ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function groupByDate(logs: DropActivityLog[]): { label: string; items: DropActivityLog[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const hourAgo = now.getTime() - 3_600_000;

  const groups: { label: string; items: DropActivityLog[] }[] = [
    { label: 'Just now', items: [] },
    { label: 'Earlier today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Older', items: [] },
  ];

  for (const log of logs) {
    const t = new Date(log.createdAt).getTime();
    if (t >= hourAgo) {
      groups[0]!.items.push(log);
    } else if (t >= todayStart) {
      groups[1]!.items.push(log);
    } else if (t >= yesterdayStart) {
      groups[2]!.items.push(log);
    } else {
      groups[3]!.items.push(log);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function describeAction(log: DropActivityLog, isYou: boolean): React.ReactNode {
  const name = isYou ? 'You' : `${log.user.firstName} ${log.user.lastName}`;
  const bold = (text: string) => (
    <strong key="name" className="font-semibold text-[#2a2118]">{text}</strong>
  );

  switch (log.action) {
    case 'created':
      return <>{bold(name)} dropped a new plan</>;
    case 'updated': {
      const fields = log.changedFields ? Object.keys(log.changedFields) : [];
      if (fields.includes('isLocked')) {
        const locked = (log.changedFields as Record<string, unknown>)['isLocked'];
        return <>{bold(name)} {locked ? 'locked' : 'unlocked'} the drop</>;
      }
      if (fields.includes('scheduledAt')) {
        return <>{bold(name)} moved the time</>;
      }
      return <>{bold(name)} updated the drop</>;
    }
    case 'joined':
      return <>{bold(name)} tapped in</>;
    case 'join_requested':
      return <>{bold(name)} requested to join</>;
    case 'join_request_approved':
      return <>{bold(name)} approved a join request</>;
    case 'join_request_rejected':
      return <>{bold(name)} rejected a join request</>;
    case 'left':
      return <>{bold(name)} left the drop</>;
    default:
      return <>{bold(name)} {log.action.replace(/_/g, ' ')}</>;
  }
}

type BadgeType = 'in' | 'out' | null;

function getBadge(action: string): BadgeType {
  if (action === 'joined') return 'in';
  return null;
}

// ── components ────────────────────────────────────────────────────────────────

function FeedAvatar({ initials, style }: { initials: string; style: AvatarStyle }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-passion text-[11px] font-extrabold tracking-[0.5px] shrink-0 ${avatarCls[style]}`}>
      {initials}
    </div>
  );
}

function FeedItemRow({ log, index, currentUserId }: { log: DropActivityLog; index: number; currentUserId?: string }) {
  const isYou = log.userId === currentUserId;
  const badge = getBadge(log.action);
  const style = isYou ? 'dark' : pickAvatarStyle(index);
  const initials = isYou ? 'YOU' : getInitials(log.user.firstName, log.user.lastName);

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-t border-[#2a2118]/6 hover:bg-[#2a2118]/1.5 transition-colors cursor-pointer">
      <FeedAvatar initials={initials} style={style} />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-[#2a2118]/72 leading-[1.4]">
          {describeAction(log, isYou)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-passion text-[9px] font-bold uppercase tracking-[1.5px] text-tok-teal bg-tok-teal/10 border border-tok-teal/15 px-2.5 py-1 rounded-full">
            {log.drop?.name ?? 'Drop'}
          </span>
          <span className="text-[#2a2118]/28 text-[11px]">·</span>
          <span className="text-[12px] text-[#2a2118]/40">{formatRelativeTime(log.createdAt)}</span>
        </div>
      </div>

      {badge === 'in' ? (
        <span className="inline-flex items-center rounded-full border border-tok-teal/20 bg-tok-teal/10 px-3 py-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-teal shrink-0">
          In
        </span>
      ) : badge === 'out' ? (
        <span className="inline-flex items-center rounded-full border border-[#2a2118]/12 bg-[#2a2118]/6 px-3 py-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/46 shrink-0">
          Out
        </span>
      ) : (
        <div className="w-10 shrink-0" />
      )}
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-t border-[#2a2118]/6">
      <Skeleton className="h-10 w-10 rounded-full shrink-0 bg-[#2a2118]/10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/5 rounded bg-[#2a2118]/10" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full bg-[#2a2118]/8" />
          <Skeleton className="h-3 w-16 rounded-full bg-[#2a2118]/6" />
        </div>
      </div>
      <Skeleton className="h-7 w-10 rounded-full shrink-0 bg-[#2a2118]/6" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.06)] overflow-hidden">
      <div className="px-6 py-3">
        <Skeleton className="h-2.5 w-16 rounded-full bg-[#2a2118]/10" />
      </div>
      <FeedItemSkeleton />
      <FeedItemSkeleton />
      <FeedItemSkeleton />
    </div>
  );
}

function Feed({
  currentUserId,
  logs,
  isLoading,
  isError,
}: {
  currentUserId?: string;
  logs: DropActivityLog[];
  isLoading: boolean;
  isError: boolean;
}) {
  const grouped = groupByDate(logs);
  const headerEventCount = logs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
            Activity
          </p>
          <h1 className="mt-2 font-passion text-[clamp(28px,3.8vw,48px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
            What&apos;s Happening
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#2a2118]/56">
            {isLoading
              ? 'Loading your activity…'
              : `${headerEventCount} event${headerEventCount !== 1 ? 's' : ''} across your Drops.`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-2 rounded-full border border-tok-teal/20 bg-tok-teal/10 px-3 py-1.5 font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-tok-teal animate-pulse" />
          Live
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/72 p-6 shadow-[0_14px_40px_rgba(42,33,24,0.05)]">
          <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
            Something slipped
          </p>
          <h2 className="mt-3 font-passion text-[24px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
            Could not load your activity.
          </h2>
          <p className="mt-3 text-[14px] leading-7 text-[#2a2118]/64">
            Try refreshing the page. Your session may need a reset if this keeps happening.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#2a2118]/14 bg-white/60 p-7 shadow-[0_14px_40px_rgba(42,33,24,0.04)]">
          <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/34">
            No activity yet
          </p>
          <h2 className="mt-3 font-passion text-[22px] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
            Your log is empty
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-7 text-[#2a2118]/64">
            Create a Drop or join one and your activity will appear here.
          </p>
          <div className="mt-5">
            <Link
              href="/drops"
              className="inline-flex items-center gap-2 rounded-full bg-tok-teal px-5 py-3 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-tok-teal/90"
            >
              Go to Drops
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.06)] overflow-hidden">
          {grouped.map((group, gi) => (
            <div key={group.label}>
              <div className={`px-6 py-3 ${gi > 0 ? 'border-t border-[#2a2118]/8' : ''}`}>
                <span className="font-passion text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/30">
                  {group.label}
                </span>
              </div>
              {group.items.map((log, idx) => (
                <FeedItemRow
                  key={log.id}
                  log={log}
                  index={idx}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GateCard() {
  return (
    <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/72 p-7 shadow-[0_14px_40px_rgba(42,33,24,0.06)]">
      <p className="font-passion text-[10px] font-bold uppercase tracking-[2.5px] text-tok-teal">
        Authentication required
      </p>
      <h2 className="mt-3 font-passion text-[clamp(28px,3.8vw,44px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
        Sign in to see your activity.
      </h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-tok-teal px-5 py-3 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#F7E9B2] transition-colors hover:bg-tok-teal/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-tok-teal/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <LogIn size={14} />
          Log in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2118]/10 bg-white/75 px-5 py-3 font-passion text-[10px] font-bold uppercase tracking-[2.2px] text-[#2a2118] transition-colors hover:border-[#2a2118]/18 hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-tok-teal/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const mounted = useMounted();
  const { user, dbUser, loading, isReady } = useAuth();
  const {
    data: activityLogs = [],
    isLoading: activityLoading,
    isError: activityError,
  } = useMyActivity({ enabled: Boolean(user) && !loading });
  const isHardLoading = activityLoading && !activityLogs.length;

  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118]">
        <TapokNavbar />
        <main className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-16 rounded-full bg-tok-teal/20" />
                <Skeleton className="h-10 w-64 rounded bg-[#2a2118]/10" />
                <Skeleton className="h-4 w-52 rounded-full bg-[#2a2118]/8" />
              </div>
              <FeedSkeleton />
            </div>
            <Skeleton className="h-64 rounded-[22px] bg-[#2a2118]/6" />
          </div>
        </main>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-tok-teal/15">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl items-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-lg">
            <GateCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-tok-teal/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(0,102,102,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(42,33,24,0.08),transparent_28%)]" />

      <TapokNavbar />

      <main className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <Feed
            currentUserId={dbUser?.id}
            logs={activityLogs}
            isLoading={isHardLoading}
            isError={activityError}
          />
          <ActivePanel
            activityLogs={activityLogs}
            activityLoading={activityLoading}
            currentUserId={dbUser?.id}
          />
        </div>
      </main>
    </div>
  );
}
