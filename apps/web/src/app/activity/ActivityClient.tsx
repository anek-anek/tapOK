'use client';

import Link from 'next/link';
import { LogIn, ArrowRight, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMounted } from '@/hooks/use-mounted';
import { TapokNavbar } from '@/components/tapok-navbar';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import { ActivePanel } from './_components/active-panel';
import { useAuth } from '@/components/providers/auth-provider';
import { useMyActivity } from '@/hooks/queries/use-drops';
import { Skeleton } from '@/components/ui/skeleton';
import type { DropActivityLog } from '@/types/drop';
import { phraseForDropLogAction } from '@/lib/drop-log-phrases';
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

  // Limit each group to 8 items
  return groups
    .map(g => ({ ...g, items: g.items.slice(0, 8) }))
    .filter((g) => g.items.length > 0);
}

function describeAction(log: DropActivityLog, isYou: boolean): React.ReactNode {
  const name = isYou ? 'You' : `${log.user.firstName} ${log.user.lastName}`;
  const bold = (text: string) => (
    <strong key="name" className="font-bold text-tok-black underline decoration-tok-teal/30 decoration-2 underline-offset-2">{text}</strong>
  );

  return (
    <>
      {bold(name)} {phraseForDropLogAction(log.action)}
    </>
  );
}

// ── components ────────────────────────────────────────────────────────────────

function FeedAvatar({ initials, style, avatar }: { initials: string; style: AvatarStyle; avatar?: string }) {
  return (
    <div className={cn(
      "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-passion text-[11px] sm:text-[14px] font-black tracking-wider shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] overflow-hidden",
      avatarCls[style]
    )}>
      <AnimatePresence mode="wait">
        {avatar ? (
          <motion.img
            key="avatar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={avatar}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <motion.span
            key="initials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {initials}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedItemRow({ log, index, currentUserId }: { log: DropActivityLog; index: number; currentUserId?: string }) {
  const isYou = log.userId === currentUserId;
  const style = isYou ? 'dark' : pickAvatarStyle(index);
  const initials = isYou ? 'YOU' : getInitials(log.user.firstName, log.user.lastName);

  return (
    <div className="group relative flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-tok-black/5 last:border-b-0 hover:bg-tok-teal/3 transition-all duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-tok-teal/80 opacity-0 group-hover:opacity-100 transition-opacity" />

      <FeedAvatar initials={initials} style={style} avatar={log.user.avatar} />

      <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
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

      <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pt-1">
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

function FeedSectionHeaderSkeleton() {
  return (
    <div className="px-6 py-3 bg-tok-black/90 border-b-2 border-tok-black/80 flex justify-between items-center">
      <Skeleton className="h-3 w-[72px] sm:w-28 rounded-sm bg-tok-cream/25" />
      <span className="w-2 h-2 rounded-full bg-tok-teal/90 shrink-0" aria-hidden />
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="w-8 h-8 sm:w-12 sm:h-12 rounded-full shrink-0 bg-tok-black/6 border-2 border-tok-black/15 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.12)]" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-[14px] sm:h-[15px] w-[92%] max-w-md rounded-sm bg-tok-black/8" />
        <Skeleton className="h-[14px] sm:h-[15px] w-[55%] mt-2 rounded-sm bg-tok-black/5 sm:hidden" />
        <div className="flex items-center gap-3 mt-2">
          <Skeleton className="h-7 w-[104px] sm:w-[120px] rounded-sm bg-tok-black/6 border-2 border-tok-teal/15" />
          <Skeleton className="h-3 w-px rounded-none bg-tok-black/15 shrink-0 hidden sm:block" />
          <Skeleton className="h-[12px] w-14 rounded-sm bg-tok-black/6" />
        </div>
      </div>
      <div className="hidden sm:flex items-center shrink-0">
        <Skeleton className="h-9 w-9 rounded-full bg-tok-black/6 border-2 border-tok-black/25" />
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
      <div>
        <FeedSectionHeaderSkeleton />
        <FeedItemSkeleton />
        <FeedItemSkeleton />
      </div>
      <div>
        <FeedSectionHeaderSkeleton />
        <FeedItemSkeleton />
        <FeedItemSkeleton />
        <FeedItemSkeleton />
      </div>
    </div>
  );
}

function ActivityHeroSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
      <div className="space-y-4 max-w-xl">
        <Skeleton className="h-3 w-40 rounded-sm bg-tok-teal/30" />
        <Skeleton className="h-[clamp(52px,11vw,100px)] w-[min(100%,280px)] sm:w-[min(100%,380px)] rounded-sm bg-tok-black/6" />
        <Skeleton className="h-4 w-40 sm:w-52 rounded-sm bg-tok-black/5" />
      </div>
      <div className="flex items-center gap-3 px-5 py-2.5 border-[3px] border-tok-black/80 shadow-[4px_4px_0px_#1C1C1A] rounded-sm bg-white self-start sm:self-auto">
        <Skeleton className="h-3 w-3 rounded-full bg-tok-teal/40 shrink-0" />
        <Skeleton className="h-4 w-[148px] sm:w-[168px] rounded-sm bg-tok-black/8" />
      </div>
    </div>
  );
}

function DropRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="mt-1 h-3 w-3 rounded-full shrink-0 bg-tok-black/6 border-2 border-tok-black/15" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-[78%] rounded-sm bg-tok-black/8" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-1/2 rounded-sm bg-tok-black/5" />
          <Skeleton className="h-3 w-2/5 rounded-sm bg-tok-black/5" />
        </div>
      </div>
      <Skeleton className="h-6 w-12 rounded-sm bg-tok-black/6 border-2 border-tok-teal/15 shrink-0 mt-0.5" />
    </div>
  );
}

function CrewRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b-2 border-tok-black/5 last:border-b-0">
      <Skeleton className="h-10 w-10 rounded-full shrink-0 bg-tok-black/6 border-2 border-tok-black/15 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.12)]" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-28 rounded-sm bg-tok-black/8" />
        <Skeleton className="h-3 w-16 rounded-sm bg-tok-black/5" />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Skeleton className="h-7 w-7 rounded-sm bg-tok-black/6" />
        <Skeleton className="h-2 w-6 rounded-sm bg-tok-black/4" />
      </div>
    </div>
  );
}

function ActivePanelSkeleton() {
  return (
    <div className="space-y-10">
      <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 bg-tok-teal/3 border-b-2 border-tok-black/80">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-sm bg-tok-teal/30 shrink-0" />
            <Skeleton className="h-3 w-28 rounded-sm bg-tok-black/8" />
          </div>
          <Skeleton className="h-3 w-12 rounded-sm bg-tok-black/6" />
        </div>
        <div className="divide-y-2 divide-tok-black/5">
          <DropRowSkeleton />
          <DropRowSkeleton />
        </div>
      </div>

      <div className="bg-tok-white border-4 border-tok-black/80 shadow-[6px_6px_0px_0px_#262624] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 bg-tok-black/90 border-b-2 border-tok-black/80">
          <Skeleton className="h-3.5 w-3.5 rounded-sm bg-tok-cream/25 shrink-0" />
          <Skeleton className="h-3 w-24 rounded-sm bg-tok-cream/25" />
        </div>
        <div className="divide-y-2 divide-tok-black/5">
          <CrewRowSkeleton />
          <CrewRowSkeleton />
          <CrewRowSkeleton />
        </div>
      </div>
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
            Unable to load drop log
          </h2>
          <p className="mt-4 text-[16px] font-medium text-tok-black/60 leading-relaxed">
            Please check your connection and try again.
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
            Quiet on the deck
          </h2>
          <p className="mt-4 text-[16px] font-medium text-tok-black/50 max-w-sm mx-auto leading-relaxed">
            Nothing in your drop log yet. Join a drop or start one to see the mission log and live activity here.
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
          {grouped.map((group) => (
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
        The drop log and live activity are for signed-in crew. Sign in to see what&apos;s moving across your drops.
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

export default function ActivityClient() {
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

  if (!mounted || !isReady || loading) {
    return (
      <div className="min-h-screen bg-tok-cream text-tok-black">
        <TapokNavbar />
        <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 lg:px-10 pb-24">
          <ActivityHeroSkeleton />
          <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
            <div>
              <FeedSkeleton />
            </div>
            <aside className="hidden lg:block">
              <ActivePanelSkeleton />
            </aside>
          </div>
          <div className="lg:hidden mt-12">
            <ActivePanelSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (isReady && !dbUser) {
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
    <div className="relative min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal selection:text-tok-cream">
      {/* Background patterns */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />


      <TapokNavbar />
      <PageBackdropWatermark label="ACTIVITY" />

      <main className="relative z-1 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 lg:px-10 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 animate-fade-up">
          <div>
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              YOUR DROP ACTIVITY
            </p>
            <h1 className="font-passion text-[clamp(52px,11vw,84px)] font-black uppercase leading-[0.8] tracking-tight text-tok-black">
              THE DROP{' '}
              <span className="text-tok-teal">LOG.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-[3px] border-tok-black shadow-[4px_4px_0px_#1C1C1A] rounded-sm font-passion text-[14px] font-black uppercase tracking-wider text-tok-black self-start sm:self-auto">
            <span className="relative flex h-3 w-3">
              {isHardLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tok-teal opacity-75" />
              ) : null}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tok-teal" />
            </span>
            {isHardLoading ? 'Syncing drop log…' : 'Live activity'}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="animate-fade-up [animation-delay:200ms]">


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
