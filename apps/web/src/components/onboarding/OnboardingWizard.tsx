'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight as IconArrowRight,
  Check as IconCheck,
  Copy as IconCopy,
  Users as IconUsers,
  MapPin as IconMapPin,
  Calendar as IconCalendar,
  Share2 as IconShare2,
  ExternalLink as IconExternalLink,
  Loader2 as IconLoader,
} from 'lucide-react';
import { useCreateDrop } from '@/hooks/mutations/use-drop-mutations';
import { useAuth } from '@/components/providers/auth-provider';
import { track } from '@/lib/analytics';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import type { Drop } from '@/types/drop';

// ─── Drop creation schema ────────────────────────────────────────────────────

const dropSchema = z.object({
  name: z.string().min(1, 'Give your drop a name'),
  scheduledAt: z.string().min(1, 'Pick a time'),
  location: z.string().min(1, 'Where are you meeting?'),
});

type DropFormValues = z.infer<typeof dropSchema>;

// ─── Shared motion config ────────────────────────────────────────────────────

const slide = {
  enter: { opacity: 0, x: 36 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
};

const springEase = [0.32, 0.72, 0, 1] as const;

// ─── Shared input style ──────────────────────────────────────────────────────

const INPUT =
  'w-full rounded-xl border border-[#2a2118]/12 bg-white px-4 py-3 text-sm text-[#2a2118] placeholder-[#2a2118]/25 outline-none transition-all duration-200 focus:border-[#006666] focus:ring-2 focus:ring-[#006666]/10 hover:border-[#2a2118]/20';

// ─── Step 0: Outcome Splash ──────────────────────────────────────────────────

function OutcomeSplash({ onChief, onCrew, onSkip }: { onChief: () => void; onCrew: () => void; onSkip: () => void }) {
  return (
    <motion.div
      key="splash"
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: springEase }}
      className="flex w-full flex-col"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[3px] text-[#2a2118]/35">
        Welcome to TapOK
      </p>
      <h1 className="mb-2 font-bebas text-[44px] leading-none uppercase tracking-wide text-[#2a2118] sm:text-[52px]">
        The plan starts<br />with you.
      </h1>
      <p className="mb-8 text-sm text-[#2a2118]/50">What brings you here today?</p>

      <div className="flex flex-col gap-3">
        {/* Chief option */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { track('onboarding_path_chief'); onChief(); }}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-[#2a2118]/10 bg-white px-4 py-4 text-left shadow-sm transition-shadow hover:shadow-md sm:px-6 sm:py-5"
        >
          <div>
            <p className="mb-0.5 font-syne text-sm font-bold uppercase tracking-wider text-[#2a2118]">
              Drop a plan
            </p>
            <p className="text-xs text-[#2a2118]/45">I&apos;m the Chief — I&apos;ll organise this</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006666] text-[#F7E9B2] transition-transform group-hover:scale-110">
            <IconArrowRight size={14} />
          </div>
        </motion.button>

        {/* Crew option */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { track('onboarding_path_crew'); onCrew(); }}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-[#2a2118]/10 bg-white px-4 py-4 text-left shadow-sm transition-shadow hover:shadow-md sm:px-6 sm:py-5"
        >
          <div>
            <p className="mb-0.5 font-syne text-sm font-bold uppercase tracking-wider text-[#2a2118]">
              Join a drop
            </p>
            <p className="text-xs text-[#2a2118]/45">I have a link or join code from a Chief</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2118] text-[#F7E9B2] transition-transform group-hover:scale-110">
            <IconUsers size={14} />
          </div>
        </motion.button>
      </div>

      <button
        onClick={onSkip}
        className="mt-3 self-center font-mono text-[10px] text-[#2a2118]/30 transition-colors hover:text-[#2a2118]/60 underline underline-offset-4"
      >
        Skip for now
      </button>

      <p className="mt-10 font-mono text-[11px] text-[#2a2118]/30">
        Built for friend groups who are tired of maybes.
      </p>
    </motion.div>
  );
}

// ─── Progress chip ───────────────────────────────────────────────────────────

function ProgressChip({ filled }: { filled: [boolean, boolean, boolean] }) {
  const done = filled.filter(Boolean).length;
  return (
    <div className="mb-5 flex items-center gap-2.5">
      {filled.map((f, i) => (
        <motion.div
          key={i}
          animate={f ? { scale: [1, 1.28, 1] } : { scale: 1 }}
          transition={{ duration: 0.22 }}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-200 ${
            f ? 'bg-[#006666] text-white' : 'bg-[#2a2118]/10 text-[#2a2118]/35'
          }`}
        >
          {f ? <IconCheck size={10} strokeWidth={3} /> : i + 1}
        </motion.div>
      ))}
      <span className="font-mono text-[10px] text-[#2a2118]/40">
        {done === 3 ? 'Ready to go live' : `${3 - done} thing${3 - done !== 1 ? 's' : ''} to go`}
      </span>
    </div>
  );
}

// ─── Step 1: Drop Builder ────────────────────────────────────────────────────

function DropBuilder({
  onBack,
  onLive,
  name,
}: {
  onBack: () => void;
  onLive: (drop: Drop) => void;
  name: string;
}) {
  const createDrop = useCreateDrop();
  const [serverError, setServerError] = useState<string | null>(null);

  // Track when the drop builder step is first viewed
  useEffect(() => { track('drop_builder_viewed'); }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DropFormValues>({
    resolver: zodResolver(dropSchema),
    defaultValues: { name: '', scheduledAt: '', location: '' },
  });

  const [dropName, scheduledAt, location] = watch(['name', 'scheduledAt', 'location']);
  const filled: [boolean, boolean, boolean] = [
    dropName.trim().length > 0,
    scheduledAt.length > 0,
    location.trim().length > 0,
  ];
  const allFilled = filled.every(Boolean);

  // Local min datetime for the native date/time picker
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const minDateTime = localNow.toISOString().slice(0, 16);

  const onSubmit = async (values: DropFormValues) => {
    setServerError(null);
    track('drop_go_live_clicked');
    try {
      const drop = await createDrop.mutateAsync({
        name: values.name.trim(),
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        location: values.location.trim(),
      });
      track('drop_created', { dropId: drop.id });
      onLive(drop);
    } catch {
      setServerError('Could not create the drop. Please try again.');
    }
  };

  return (
    <motion.div
      key="builder"
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: springEase }}
      className="w-full"
    >
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-xs text-[#2a2118]/40 transition-colors hover:text-[#2a2118]/70"
      >
        ← Back
      </button>

      <ProgressChip filled={filled} />

      <h2 className="mb-1 font-bebas text-[38px] leading-none uppercase tracking-wide text-[#2a2118] sm:text-[44px]">
        Drop a plan.
      </h2>
      <p className="mb-6 text-sm text-[#2a2118]/50">
        Give your crew one clear thing to say yes or no to.
      </p>

      {/* Host preview */}
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/40 px-4 py-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006666] font-mono text-[9px] font-bold text-[#F7E9B2]">
          {name.charAt(0).toUpperCase()}
        </div>
        <p className="text-xs text-[#2a2118]/55">
          <span className="font-semibold text-[#2a2118]/75">{name}</span> is dropping a plan
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Drop name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-[#2a2118]/45">
            Name
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Friday tacos"
            autoFocus
            className={INPUT}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* Date/time */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#2a2118]/45">
            <IconCalendar size={11} />
            When
          </label>
          <input
            {...register('scheduledAt')}
            type="datetime-local"
            min={minDateTime}
            className={INPUT}
          />
          {errors.scheduledAt && <p className="text-xs text-red-600">{errors.scheduledAt.message}</p>}
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#2a2118]/45">
            <IconMapPin size={11} />
            Where
          </label>
          <input
            {...register('location')}
            type="text"
            placeholder="El Camino, BGC"
            className={INPUT}
          />
          {errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">{serverError}</p>
          </div>
        )}

        <div className="mt-1 flex flex-col gap-2">
          <p className="text-center font-mono text-[9px] uppercase tracking-[2px] text-[#2a2118]/25">
            No maybes — crew taps In or Out
          </p>
          <motion.button
            type="submit"
            disabled={isSubmitting || !allFilled}
            whileHover={allFilled ? { y: -2 } : {}}
            whileTap={allFilled ? { scale: 0.98 } : {}}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#006666] px-6 py-3.5 font-syne text-[11px] font-bold uppercase tracking-[2px] text-[#F7E9B2] shadow-sm transition-all hover:bg-[#006666]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <IconLoader size={13} className="animate-spin" />
                Going Live…
              </>
            ) : (
              'Go Live'
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Step 2: Live Confirmation (Aha Moment) ──────────────────────────────────

function DropLive({ drop }: { drop: Drop }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/drops/join/${drop.joinCode}`
      : drop.shareUrl;

  function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    track('drop_share_link_copied', { dropId: drop.id });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare() {
    track('drop_send_to_crew_clicked', { dropId: drop.id });
    if (navigator.share) {
      await navigator.share({
        title: drop.name,
        text: `Tap In if you're coming. No maybes:`,
        url: shareUrl,
      });
    } else {
      await handleCopy();
    }
  }

  return (
    <motion.div
      key="live"
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: springEase }}
      className="flex w-full flex-col"
    >
      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#006666]/10 px-3.5 py-1.5"
      >
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.25, 1] }}
          transition={{ repeat: Infinity, repeatDelay: 1.0, duration: 0.55 }}
          className="h-1.5 w-1.5 rounded-full bg-[#006666]"
        />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-[#006666]">
          Drop is live
        </span>
      </motion.div>

      <h2 className="mb-1 font-bebas text-[38px] leading-none uppercase tracking-wide text-[#2a2118] sm:text-[44px]">
        Your drop is live.
      </h2>
      <p className="mb-6 text-sm text-[#2a2118]/50">Now get your first In.</p>

      {/* Drop card */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.38 }}
        className="mb-5 overflow-hidden rounded-2xl border border-[#2a2118]/10 border-l-[4px] border-l-[#006666] bg-white shadow-[0_8px_24px_rgba(42,33,24,0.07)]"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="mb-2.5 font-syne text-[15px] font-bold text-[#2a2118]">{drop.name}</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-[#2a2118]/55">
                <IconCalendar size={11} className="shrink-0" />
                <span>{formatDateTime(drop.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#2a2118]/55">
                <IconMapPin size={11} className="shrink-0" />
                <span className="truncate">{drop.location}</span>
              </div>
            </div>
          </div>

          {/* LIVE stamp */}
          <motion.div
            initial={{ rotate: -14, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.36, duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className="ml-3 shrink-0 rounded border border-[#006666]/60 px-1.5 py-0.5"
          >
            <span className="font-mono text-[8px] font-bold uppercase tracking-[2px] text-[#006666]">
              Live
            </span>
          </motion.div>
        </div>

        <div className="border-t border-[#2a2118]/8 px-5 py-2.5">
          <p className="font-mono text-[10px] text-[#2a2118]/35">
            Join code:{' '}
            <span className="font-bold tracking-wider text-[#2a2118]/60">{drop.joinCode}</span>
          </p>
        </div>
      </motion.div>

      {/* Share link */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.35 }}
        className="mb-5"
      >
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[2px] text-[#2a2118]/35">
          Send this where the chaos usually starts
        </p>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-[#2a2118]/10 bg-white">
          <p className="flex-1 truncate px-4 py-2.5 font-mono text-[11px] text-[#2a2118]/55">
            {shareUrl}
          </p>
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 border-l border-[#2a2118]/8 px-3.5 py-2.5 transition-colors hover:bg-[#F7E9B2]/60"
          >
            {copied ? (
              <IconCheck size={12} className="text-[#006666]" />
            ) : (
              <IconCopy size={12} className="text-[#2a2118]/40" />
            )}
            <span className="font-mono text-[10px] text-[#2a2118]/50">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38, duration: 0.35 }}
        className="flex flex-col gap-2.5"
      >
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="flex items-center justify-center gap-2 rounded-full bg-[#006666] px-6 py-3.5 font-syne text-[11px] font-bold uppercase tracking-[2px] text-[#F7E9B2] shadow-sm transition-all hover:bg-[#006666]/90"
        >
          <IconShare2 size={13} />
          Send to crew
        </motion.button>

        <button
          onClick={() => { track('drop_view_clicked', { dropId: drop.id }); router.push(`/drops/${drop.id}`); }}
          className="flex items-center justify-center gap-2 rounded-full border border-[#2a2118]/12 bg-transparent px-6 py-3 font-syne text-[11px] font-bold uppercase tracking-[2px] text-[#2a2118]/55 transition-colors hover:bg-[#2a2118]/5"
        >
          <IconExternalLink size={12} />
          View my drop
        </button>
      </motion.div>

      {/* Founder note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="mt-7 font-mono text-[10px] italic leading-relaxed text-[#2a2118]/30"
      >
        &ldquo;We built TapOK because plans deserve better than buried DMs. Your first drop is live.
        Now make it happen.&rdquo;
      </motion.p>
    </motion.div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { dbUser } = useAuth();

  // firstName from URL param (set by RegisterForm after fresh signup) or from dbUser
  // for users who navigate directly to /onboarding while already authenticated.
  const firstName = params.get('name') ?? dbUser?.firstName ?? 'You';

  const [step, setStep] = useState(0);
  const [liveDrop, setLiveDrop] = useState<Drop | null>(null);

  // Track when onboarding is first viewed
  useEffect(() => { track('onboarding_started'); }, []);

  const handleLive = (drop: Drop) => {
    setLiveDrop(drop);
    setStep(2);
  };

  return (
    <AuthPageShell footerClassName="">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <OutcomeSplash
                onChief={() => setStep(1)}
                onCrew={() => router.push('/drops')}
                onSkip={() => router.push('/')}
              />
            )}
            {step === 1 && (
              <DropBuilder
                onBack={() => setStep(0)}
                onLive={handleLive}
                name={firstName}
              />
            )}
            {step === 2 && liveDrop && (
              <DropLive drop={liveDrop} />
            )}
          </AnimatePresence>
    </AuthPageShell>
  );
}
