'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import { track } from '@/lib/analytics';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { toast } from 'react-hot-toast';
import type { Drop } from '@/types/drop';
import { DropModal } from '@/components/drop-modal';
import { sanitizeRedirectTo } from '@/lib/auth/redirects';

const slide = {
  enter: { opacity: 0, y: 15 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
};


function OutcomeSplash({ onChief, onCrew, onSkip }: { onChief: () => void; onCrew: () => void; onSkip: () => void }) {
  return (
    <motion.div
      key="splash"
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex w-full flex-col"
    >
      <div
        className="mb-3 inline-flex w-fit items-center gap-2"
        style={{
          background: '#006666',
          color: 'var(--color-tok-cream)',
          fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          border: '2px solid #000',
          boxShadow: '3px 3px 0 #000',
        }}
      >
        WELCOME TO TAPOK
      </div>

      <h1 className="mb-2 font-passion text-[48px] leading-[0.9] uppercase tracking-tighter text-black sm:text-[56px]">
        THE PLAN STARTS<br />WITH YOU.
      </h1>
      <p className="mb-8 font-inter text-sm text-black/50">What brings you here today?</p>

      <div className="flex flex-col gap-4">
        {/* Chief option */}
        <button
          onClick={() => { track('onboarding_path_chief'); onChief(); }}
          className="group flex items-center justify-between gap-4 border-2 border-black bg-white px-5 py-5 text-left transition-all duration-200"
          style={{ boxShadow: '4px 4px 0 #000' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #000';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #000';
          }}
        >
          <div>
            <p className="mb-0.5 font-passion text-xl uppercase tracking-tight text-black">
              Drop a plan
            </p>
            <p className="font-inter text-xs text-black/45">I&apos;m the Chief — I&apos;ll organise this</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-tok-teal text-white transition-transform group-hover:scale-110 shadow-[2px_2px_0_#000]">
            <IconArrowRight size={18} strokeWidth={3} />
          </div>
        </button>

        {/* Crew option */}
        <button
          onClick={() => { track('onboarding_path_crew'); onCrew(); }}
          className="group flex items-center justify-between gap-4 border-2 border-black bg-white px-5 py-5 text-left transition-all duration-200"
          style={{ boxShadow: '4px 4px 0 #000' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #000';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #000';
          }}
        >
          <div>
            <p className="mb-0.5 font-passion text-xl uppercase tracking-tight text-black">
              Join a drop
            </p>
            <p className="font-inter text-xs text-black/45">I have a link or join code</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-tok-cream transition-transform group-hover:scale-110 shadow-[2px_2px_0_#000]">
            <IconUsers size={18} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      <button
        onClick={onSkip}
        className="mt-6 self-center font-passion text-xs uppercase tracking-widest text-black/30 transition-colors hover:text-black/60 underline underline-offset-8"
      >
        Skip for now
      </button>

      <p className="mt-12 font-inter text-[11px] uppercase tracking-wider text-black/25">
        Built for groups who are tired of &quot;maybe&quot;.
      </p>
    </motion.div>
  );
}

import { ModalShell } from '@/components/modal-shell';
import { X as IconX } from 'lucide-react';

import { dropsService } from '@/services/drops.service';

function JoinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => { track('crew_code_entry_viewed'); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) return;

    setIsChecking(true);
    try {
      const drop = await dropsService.getByJoinCode(trimmed);
      track('crew_code_submitted', { code: trimmed, dropId: drop.id });
      toast.success('DROP FOUND! TAPPING YOU IN...');
      router.push(`/drops/join/${trimmed}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'INVALID JOIN CODE';
      toast.error(String(msg).toUpperCase());
      setIsChecking(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <div className="flex w-full max-w-md flex-col overflow-hidden border-[3px] border-black bg-tok-cream p-6 sm:p-8 shadow-[10px_10px_0px_#262624]">
          <div className="mb-6 flex items-start justify-between text-left">
            <div className="flex-1 text-left">
              <h2 className="font-passion text-3xl uppercase tracking-tight text-black text-left">
                JOIN A DROP.
              </h2>
              <p className="font-inter text-sm text-black/40 text-left">
                Enter the code provided by your Chief.
              </p>
            </div>
            <button
              onClick={close}
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white text-black transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#000]"
            >
              <IconX size={18} strokeWidth={2.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex h-14 sm:h-16 items-stretch border-[3px] border-black bg-white shadow-[6px_6px_0_#262624]">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ACCESS CODE"
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                disabled={isChecking}
                className="min-w-0 flex-1 px-4 sm:px-5 font-passion text-lg sm:text-xl font-bold tracking-widest text-black placeholder:text-black/15 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={code.trim().length < 4 || isChecking}
                className="flex items-center justify-center border-l-[3px] border-black bg-[#D9D9D9] px-6 sm:px-10 font-passion text-lg sm:text-xl font-bold tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:opacity-40"
              >
                {isChecking ? (
                  <IconLoader className="animate-spin" size={20} />
                ) : (
                  'JOIN'
                )}
              </button>
            </div>

            <p className="mt-6 text-left font-inter text-[11px] uppercase tracking-wider text-black/25">
              Crew taps in or out. No maybes allowed.
            </p>
          </form>
        </div>
      )}
    </ModalShell>
  );
}

function DropLive({ drop }: { drop: Drop }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    toast.success('LINK COPIED TO CLIPBOARD');
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex w-full flex-col"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-2 w-2 rounded-full bg-tok-teal animate-livepulse shadow-[0_0_8px_rgba(0,102,102,0.6)]" />
        <span className="font-passion text-xs uppercase tracking-[0.2em] text-tok-teal font-bold">
          DROP IS LIVE
        </span>
      </div>

      <h2 className="mb-1 font-passion text-[48px] leading-[0.9] uppercase tracking-tighter text-black sm:text-[56px]">
        YOUR DROP<br />IS LIVE.
      </h2>
      <p className="mb-8 font-inter text-sm text-black/50">Now get your first Tap In.</p>

      {/* Drop card summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-8 border-2 border-black bg-white shadow-[6px_6px_0_#262624]"
      >
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="font-passion text-2xl uppercase leading-none text-black">{drop.name}</h3>
            <div className="border-2 border-tok-teal px-2 py-0.5 shadow-[2px_2px_0_#000]">
              <span className="font-passion text-[10px] uppercase tracking-widest text-tok-teal font-bold">LIVE</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 font-passion text-xs uppercase tracking-wider text-black/60">
              <IconCalendar size={14} className="text-tok-teal" />
              <span>{formatDateTime(drop.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-3 font-passion text-xs uppercase tracking-wider text-black/60">
              <IconMapPin size={14} className="text-tok-teal" />
              <span className="truncate">{drop.location}</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-black/10 bg-tok-cream/20 px-5 py-3">
          <p className="font-passion text-xs uppercase tracking-widest text-black/40">
            JOIN CODE: <span className="text-black font-bold text-sm tracking-normal">{drop.joinCode}</span>
          </p>
        </div>
      </motion.div>

      {/* Share link container */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-8"
      >
        <p className="mb-2 font-passion text-[10px] uppercase tracking-[0.2em] text-black/35">
          SEND THIS WHERE THE CHAOS USUALLY STARTS
        </p>
        <div className="flex items-stretch border-2 border-black bg-white shadow-[4px_4px_0_#000]">
          <p className="flex-1 truncate px-4 py-3 font-inter text-xs text-black/55">
            {shareUrl}
          </p>
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-2 border-l-2 border-black px-4 py-3 transition-colors hover:bg-tok-teal hover:text-white"
          >
            {copied ? (
              <IconCheck size={14} strokeWidth={3} />
            ) : (
              <IconCopy size={14} />
            )}
            <span className="font-passion text-xs uppercase tracking-widest font-bold">
              {copied ? 'COPIED' : 'COPY'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Primary Actions */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col gap-4"
      >
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-3 border-2 border-black bg-tok-teal px-8 py-4 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] transition-all duration-150"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px #262624';
            (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px #262624';
            (e.currentTarget as HTMLElement).style.backgroundColor = '';
          }}
        >
          <IconShare2 size={20} strokeWidth={2.5} />
          SEND TO CREW
        </button>

        <button
          onClick={() => { track('drop_view_clicked', { dropId: drop.id }); router.push(`/drops/${drop.id}`); }}
          className="flex items-center justify-center gap-2 border-2 border-black bg-transparent px-8 py-3.5 font-passion text-lg uppercase tracking-widest text-black/60 transition-all hover:bg-black hover:text-white"
        >
          <IconExternalLink size={16} />
          VIEW MY DROP
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-10 font-inter text-[11px] uppercase tracking-widest leading-relaxed text-black/25 text-center"
      >
        Plans deserve better than buried DMs.<br />Your first drop is live.
      </motion.p>
    </motion.div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectTo(searchParams.get('redirectTo'));

  const [step, setStep] = useState(0);
  const [path, setPath] = useState<'chief' | 'crew' | null>(null);
  const [liveDrop, setLiveDrop] = useState<Drop | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { track('onboarding_started'); }, []);

  const handleLive = (drop: Drop) => {
    setLiveDrop(drop);
    setStep(2);
    setShowModal(false);
  };

  const handleChiefStart = () => {
    setPath('chief');
    setStep(1);
    setShowModal(true);
  };

  return (
    <AuthPageShell footerClassName="hidden sm:block">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <OutcomeSplash
            onChief={handleChiefStart}
            onCrew={() => { setPath('crew'); setStep(1); setShowModal(true); }}
            onSkip={() => router.push(redirectTo)}
          />
        )}

        {step === 1 && path === 'chief' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-tok-teal/10">
              <IconLoader className="animate-spin text-tok-teal" size={32} />
            </div>
            <h2 className="font-passion text-3xl uppercase tracking-tight text-black">
              Initializing Drop...
            </h2>
            <p className="mt-2 font-inter text-sm text-black/40">
              Wait for the Chief&apos;s terminal to open.
            </p>

            {showModal && (
              <DropModal
                onClose={() => {
                  setShowModal(false);
                  setStep(0);
                  setPath(null);
                }}
                onSuccess={handleLive}
              />
            )}
          </div>
        )}

        {step === 1 && path === 'crew' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-tok-teal/10">
              <IconLoader className="animate-spin text-tok-teal" size={32} />
            </div>
            <h2 className="font-passion text-3xl uppercase tracking-tight text-black">
              Syncing Crew...
            </h2>
            <p className="mt-2 font-inter text-sm text-black/40">
              Connecting to the Chief&apos;s mission.
            </p>

            {showModal && (
              <JoinModal
                onClose={() => {
                  setShowModal(false);
                  setStep(0);
                  setPath(null);
                }}
              />
            )}
          </div>
        )}

        {step === 2 && liveDrop && (
          <DropLive drop={liveDrop} />
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
}
