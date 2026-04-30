'use client';

import Link from 'next/link';
import { LogIn, ArrowRight, Activity as ActivityIcon } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';
import { TapokNavbar } from '@/components/tapok-navbar';
import { ActivePanel } from './_components/active-panel';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyActivity } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';
import type { DropActivityLog } from '@/types/drop';
import { cn } from '@/lib/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

type AvatarStyle = 'teal' | 'dark' | 'pale' | 'muted';

const avatarCls: Record<AvatarStyle, string> = {
  teal: 'bg-tok-teal text-tok-cream border-2 border-tok-black',
  dark: 'bg-tok-black text-tok-cream border-2 border-tok-black',
  pale: 'bg-tok-teal-pale text-tok-teal border-2 border-tok-black',
  muted: 'bg-tok-muted-lt/20 text-tok-black border-2 border-tok-black',
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
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function groupByDate(logs: DropActivityLog[]): { label: string; items: DropActivityLog[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const hourAgo = now.getTime() - 3_600_000;

  const groups: { label: string; items: DropActivityLog[] }[] = [
    { label: 'Just now', items: [] },
    { label: 'Today', items: [] },
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

  groups[0]!.items = groups[0]!.items.slice(0, 4);
  groups[1]!.items = groups[1]!.items.slice(0, 8);

  return groups.filter((g) => g.items.length > 0);
}

function describeAction(log: DropActivityLog, isYou: boolean): React.ReactNode {
  const name = isYou ? 'You' : `${log.user.firstName} ${log.user.lastName}`;
  const bold = (text: string) => (
    <strong key="name" className="font-bold text-tok-black underline decoration-tok-teal/30 decoration-2 underline-offset-2">{text}</strong>
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

// ── components ────────────────────────────────────────────────────────────────

function FeedAvatar({ initials, style }: { initials: string; style: AvatarStyle }) {
  return (
    <div className={cn(
      "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-passion text-[11px] sm:text-[14px] font-black tracking-wider shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]",
      avatarCls[style]
    )}>
      {initials}
    </div>
  );
}

function FeedItemRow({ log, index, currentUserId }: { log: DropActivityLog; index: number; currentUserId?: string }) {
  const isYou = log.userId === currentUserId;
  const style = isYou ? 'dark' : pickAvatarStyle(index);
  const initials = isYou ? 'YOU' : getInitials(log.user.firstName, log.user.lastName);

  return (
    <div className="group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-tok-black/5 last:border-b-0 hover:bg-tok-teal/[0.03] transition-all duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-tok-teal/80 opacity-0 group-hover:opacity-100 transition-opacity" />

      <FeedAvatar initials={initials} style={style} />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] sm:text-[15px] text-tok-black/80 leading-snug">
          {describeAction(log, isYou)}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href={`/drops/${log.dropId}`}
            className="font-passion text-[10px] font-bold uppercase tracking-widest text-tok-teal bg-tok-teal/5 border-2 border-tok-teal/20 px-3 py-1 rounded-sm hover:bg-tok-teal hover:text-tok-cream hover:border-tok-black transition-all"
          >
            {log.drop?.name ?? 'Drop'}
          </Link>
          <span className="text-tok-black/20 text-[12px] font-black">/</span>
          <span className="text-[12px] font-medium text-tok-black/40 tabular-nums">{formatRelativeTime(log.createdAt)}</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <Link
          href={`/drops/${log.dropId}`}
          className="p-2 rounded-full border-2 border-tok-black/80 hover:bg-tok-teal hover:text-tok-cream transition-colors"
        >
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="w-8 h-8 sm:w-12 sm:h-12 rounded-full shrink-0 bg-tok-black/5 border-2 border-tok-black/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-sm bg-tok-black/5" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-sm bg-tok-black/5" />
          <Skeleton className="h-3 w-12 rounded-sm bg-tok-black/5" />
        </div>
      </div>
      <div className="hidden sm:block">
        <Skeleton className="h-8 w-8 rounded-full bg-tok-black/5 border-2 border-tok-black/10" />
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[16px] border border-tok-black/5 bg-tok-white/40 px-4 py-3.5">
      <Skeleton className="h-10 w-10 rounded-full bg-tok-black/5" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-16 rounded-full bg-tok-black/5" />
        <Skeleton className="h-4 w-40 rounded bg-tok-black/5" />
        <Skeleton className="h-2.5 w-52 rounded-full bg-tok-black/5" />
      </div>
      <Skeleton className="h-7 w-16 rounded-full bg-tok-black/5" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-tok-black/5 border-b-2 border-tok-black/10">
        <Skeleton className="h-3 w-24 rounded-sm bg-tok-black/10" />
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

  return (
    <div className="space-y-6">
      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <div className="bg-tok-white border-4 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-6 sm:p-8">
          <div className="w-16 h-16 bg-red-100 border-2 border-tok-black rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-passion text-[32px] font-black uppercase tracking-tight text-tok-black leading-none">
            Ledger Error
          </h2>
          <p className="mt-4 text-[16px] font-medium text-tok-black/60 leading-relaxed">
            We couldn't retrieve the activity stream. This usually means the connection was interrupted.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-4 bg-tok-teal text-tok-cream border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all font-passion text-[16px] font-black uppercase tracking-widest"
          >
            Reconnect
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-tok-white border-4 border-dashed border-tok-black/20 p-12 text-center rounded-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-tok-cream-dim border-2 border-tok-black rounded-full mb-8">
            <ActivityIcon size={32} className="text-tok-black/30" />
          </div>
          <h2 className="font-passion text-[32px] font-black uppercase tracking-tight text-tok-black">
            Silence in the ranks
          </h2>
          <p className="mt-4 text-[16px] font-medium text-tok-black/50 max-w-sm mx-auto leading-relaxed">
            Your activity ledger is waiting for its first entry. Join a Drop or start one to see things moving.
          </p>
          <div className="mt-10">
            <Link
              href="/drops"
              className="inline-flex items-center gap-3 px-8 py-4 bg-tok-teal text-tok-cream border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-passion text-[16px] font-black uppercase tracking-widest"
            >
              Browse Drops
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
          {grouped.map((group, gi) => (
            <div key={group.label} className="relative">
              <div className="px-6 py-3 bg-tok-black/90 border-b-2 border-tok-black/80 sticky top-0 z-10 flex justify-between items-center">
                <span className="font-passion text-[12px] font-black uppercase tracking-[3px] text-tok-cream">
                  {group.label}
                </span>
                <span className="w-2 h-2 rounded-full bg-tok-teal" />
              </div>
              <div className="divide-y-2 divide-tok-black/5">
                {group.items.map((log, idx) => (
                  <FeedItemRow
                    key={log.id}
                    log={log}
                    index={idx}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GateCard() {
  return (
    <div className="bg-tok-white border-4 border-tok-black/80 p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.8)] rounded-2xl animate-fade-up">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-tok-teal border-2 border-tok-black rounded-sm mb-6">
        <span className="font-passion text-[12px] font-bold uppercase tracking-widest text-tok-cream">
          Restricted Access
        </span>
      </div>
      <h2 className="font-passion text-[clamp(40px,10vw,80px)] font-black uppercase leading-[0.85] tracking-tighter text-tok-black">
        Identify <br /> <span className="text-tok-teal">Yourself</span>
      </h2>
      <p className="mt-6 sm:mt-8 text-[16px] sm:text-[18px] font-medium text-tok-black/60 leading-relaxed max-w-md">
        The activity ledger is reserved for verified crew members. Sign in to track your squad.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-3 px-8 py-4 bg-tok-teal text-tok-cream border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-passion text-[16px] font-black uppercase tracking-widest"
        >
          <LogIn size={20} />
          Log in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-3 px-8 py-4 bg-tok-cream text-tok-black border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-passion text-[16px] font-black uppercase tracking-widest"
        >
          Join Crew
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
    isFetched: activityFetched,
  } = useMyActivity({ enabled: Boolean(user) && !loading });

  // Show skeleton if we're fetching the first batch of data or if the query hasn't run yet
  const isHardLoading = !activityFetched || (activityLoading && !activityLogs.length);

  if (!mounted || !isReady || (loading && !dbUser)) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black">
        <TapokNavbar />
        <main className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-16 lg:px-10">
          <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1fr_340px]">
            <div className="space-y-10">
              <div className="space-y-6">
                <Skeleton className="h-24 sm:h-32 w-3/4 rounded-sm bg-tok-black/5" />
                <Skeleton className="h-6 w-1/2 rounded-sm bg-tok-black/5" />
              </div>
              <FeedSkeleton />
            </div>
            <div className="hidden lg:block space-y-10">
              <Skeleton className="h-[250px] rounded-xl border-4 border-tok-black/5 bg-tok-white/40 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]" />
              <Skeleton className="h-[300px] rounded-xl border-4 border-tok-black/5 bg-tok-white/40 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal selection:text-tok-cream">
        <TapokNavbar />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 py-12 lg:px-10">
          <div className="w-full max-w-2xl">
            <GateCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal selection:text-tok-cream">
      {/* Background patterns */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />


      <TapokNavbar />

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-16 lg:px-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 animate-fade-up">
          <div>
            <h1 className="font-passion text-[clamp(56px,15vw,84px)] font-black uppercase leading-[0.8] tracking-tighter text-tok-black">
              What's <span className="text-tok-teal">Happening</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] font-medium leading-relaxed text-tok-black/60 max-w-md">
              {isHardLoading
                ? 'Synchronizing ledger data...'
                : `${activityLogs.length} update${activityLogs.length !== 1 ? 's' : ''} tracked across your current Drops.`}
            </p>
          </div>
        </div>

        {/* Live Feed Status Pill - Now at the top on mobile */}
        <div className="flex items-center gap-3 mb-6 animate-fade-up [animation-delay:100ms] lg:hidden">
          <div className="flex items-center gap-3 px-4 py-2 bg-tok-cream border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] rounded-sm font-passion text-[14px] font-black uppercase tracking-wider text-tok-black">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tok-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tok-teal"></span>
            </span>
            Live Feed
          </div>
        </div>

        <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1fr_340px]">
          <div className="animate-fade-up [animation-delay:200ms]">
            {/* Desktop-only Live Feed header/pill */}
            <div className="hidden lg:flex items-center justify-end mb-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-tok-cream border-2 border-tok-black/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] rounded-sm font-passion text-[14px] font-black uppercase tracking-wider text-tok-black">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tok-teal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-tok-teal"></span>
                </span>
                Live Feed
              </div>
            </div>

            <Feed
              currentUserId={dbUser?.id}
              logs={activityLogs}
              isLoading={isHardLoading}
              isError={activityError}
            />
          </div>
          <aside className="hidden lg:block animate-fade-up [animation-delay:300ms]">
            <ActivePanel
              activityLogs={activityLogs}
              activityLoading={isHardLoading}
              currentUserId={dbUser?.id}
            />
          </aside>
        </div>

        {/* Mobile Active Panel - Now at the bottom */}
        <div className="lg:hidden mt-12 animate-fade-up [animation-delay:400ms]">
          <ActivePanel
            activityLogs={activityLogs}
            activityLoading={isHardLoading}
            currentUserId={dbUser?.id}
          />
        </div>
      </main>
    </div>
  );
}
