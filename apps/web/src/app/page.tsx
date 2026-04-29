'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useMounted } from '@/hooks/use-mounted';
import { ShieldCheck, Headphones, Smartphone, Zap, Users, Bell, Link2, BarChart2, Lock } from 'lucide-react';
import { useState } from 'react';

const flipSteps = [
  {
    id: 'plan',
    num: '01',
    teaser: 'DROP A\nPLAN.',
    accentBg: '#006666',
    accentText: '#FFF4BD',
    backBg: '#FFF4BD',
    backBorder: '#006666',
    heading: 'Be the Chief.',
    body: "Pin a name, a time, and a place. Give your crew one clear thing to say yes or no to — no group-chat chaos, no back-and-forth.",
    tag: 'YOU START IT',
    backTextColor: '#000',
    backBodyColor: 'rgba(0,0,0,0.6)',
    backHintColor: 'rgba(0,0,0,0.25)',
    tagBg: '#006666',
    tagText: '#FFF4BD',
  },
  {
    id: 'share',
    num: '02',
    teaser: 'SPREAD\nTHE WORD.',
    accentBg: '#000',
    accentText: '#FFF4BD',
    backBg: '#FFF4BD',
    backBorder: '#000',
    heading: 'One link. Everywhere.',
    body: "Your Drop goes live instantly. Blast the link wherever the chaos usually starts — group chat, DMs, anywhere. One tap and they're in.",
    tag: 'SHARE IT',
    backTextColor: '#000',
    backBodyColor: 'rgba(0,0,0,0.6)',
    backHintColor: 'rgba(0,0,0,0.25)',
    tagBg: '#000',
    tagText: '#FFF4BD',
  },
  {
    id: 'live',
    num: '03',
    teaser: 'TAP IN.\nNO MAYBES.',
    accentBg: '#FFF4BD',
    accentText: '#006666',
    backBg: '#006666',
    backBorder: '#006666',
    heading: 'Live headcount.',
    body: "Crew taps In or Out. You get a live roster instantly — no awkward follow-ups, no buried DMs, just a clear count so the plan actually happens.",
    tag: 'DONE.',
    backTextColor: '#FFF4BD',
    backBodyColor: 'rgba(255,244,189,0.75)',
    backHintColor: 'rgba(255,244,189,0.4)',
    tagBg: '#FFF4BD',
    tagText: '#006666',
  },
];

function FlipCard({
  step,
  isFlipped,
  onToggle,
  delay,
}: {
  step: typeof flipSteps[number];
  isFlipped: boolean;
  onToggle: () => void;
  delay: number;
}) {
  return (
    <div
      className="flip-card-wrapper"
      style={{ animationDelay: `${delay}ms`, perspective: '1200px', cursor: 'pointer' }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
      aria-label={`Step ${step.num}: ${step.teaser.replace('\n', ' ')}`}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: step.accentBg,
            border: '3px solid #000',
            boxShadow: '6px 6px 0px #000',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px 24px 24px',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
              fontSize: 'clamp(64px, 8vw, 96px)',
              fontWeight: 700,
              lineHeight: 1,
              color: step.accentText,
              opacity: 0.18,
            }}
          >
            {step.num}
          </span>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: step.accentText,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                whiteSpace: 'pre-line',
                marginBottom: '16px',
              }}
            >
              {step.teaser}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter, Inter, sans-serif)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: step.accentText,
                  opacity: 0.55,
                }}
              >
                tap to reveal
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ opacity: 0.5 }}>
                <path d="M7 1 L13 7 L7 13" stroke={step.accentText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="1" y1="7" x2="13" y2="7" stroke={step.accentText} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: step.backBg,
            border: `3px solid ${step.backBorder}`,
            boxShadow: '6px 6px 0px #000',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px 24px 24px',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              background: step.tagBg,
              color: step.tagText,
              fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '2px',
            }}
          >
            {step.tag}
          </div>
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
                fontSize: 'clamp(24px, 2.8vw, 34px)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: step.backTextColor,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '12px',
              }}
            >
              {step.heading}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-inter, Inter, sans-serif)',
                fontSize: '14px',
                lineHeight: 1.65,
                color: step.backBodyColor,
              }}
            >
              {step.body}
            </p>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: step.backHintColor,
            }}
          >
            tap to flip back
          </span>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks({ dbUser, mounted, loading }: { dbUser: unknown; mounted: boolean; loading: boolean; }) {
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const toggle = (i: number) => setFlipped((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <section className="bg-[#FFF4BD] px-5 py-12 md:px-10 lg:px-20">
      <style>{`
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(32px) rotate(-1deg); }
          to   { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        .flip-card-wrapper {
          height: 300px;
          animation: cardEntrance 0.55s ease both;
          outline: none;
        }
        .flip-card-wrapper:focus-visible {
          outline: 3px solid #006666;
          outline-offset: 4px;
          border-radius: 4px;
        }
        @media (min-width: 768px) {
          .flip-card-wrapper { height: 340px; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#006666',
              color: '#FFF4BD',
              fontFamily: 'var(--font-passion-one, "Passion One", sans-serif)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '5px 14px',
              borderRadius: '2px',
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
            }}
          >
            3 STEPS. THAT&apos;S IT.
          </div>
          <h2
            className="font-passion font-bold uppercase leading-none text-black"
            style={{ fontSize: 'clamp(36px,6vw,68px)', letterSpacing: '-0.01em' }}
          >
            HOW DOES TAPOK WORK?
          </h2>
          <p className="max-w-md font-inter text-base leading-relaxed text-black/50">
            Tap each card to see what happens — it&apos;s faster than reading a manual.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {flipSteps.map((step, i) => (
            <FlipCard
              key={step.id}
              step={step}
              isFlipped={flipped[i] ?? false}
              onToggle={() => toggle(i)}
              delay={i * 110}
            />
          ))}
        </div>

        {mounted && !loading && (
          <div className="mt-14 flex flex-col items-center gap-3">
            <Link
              href={(dbUser as { id?: string })?.id ? '/drops/create' : '/login'}
              className="inline-block font-passion text-xl uppercase tracking-wider text-white active:scale-[0.97]"
              style={{
                background: '#006666',
                padding: '14px 40px',
                border: '3px solid #000',
                boxShadow: '5px 5px 0 #000',
                borderRadius: '4px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '7px 7px 0 #000';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '5px 5px 0 #000';
              }}
            >
              Start your first Drop
            </Link>
            <p className="font-inter text-xs text-black/35 uppercase tracking-widest">
              free to use · no maybes allowed
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const tourFeatures = [
  {
    id: 'instant',
    icon: Zap,
    label: 'Instant Drops',
    tag: 'SPEED',
    heading: 'Live in under\n60 seconds.',
    body: 'Name it, time it, place it. Your Drop is live the moment you hit create — no approvals, no waiting. The plan exists before anyone has a chance to overthink it.',
    accent: '#006666',
  },
  {
    id: 'roster',
    icon: Users,
    label: 'Live Roster',
    tag: 'CLARITY',
    heading: 'Always know\nwho\'s in.',
    body: 'Watch your headcount update in real time as crew taps in. No polling threads, no "did you see my message?" — just a clean, live list of who\'s actually showing up.',
    accent: '#FFF4BD',
  },
  {
    id: 'nudge',
    icon: Bell,
    label: 'Auto Nudges',
    tag: 'NO CHASE',
    heading: 'Stop chasing\npeople down.',
    body: 'TapOK pings the fence-sitters so you don\'t have to. Automated reminders go out before the Drop closes — you stay the Chief, not the nag.',
    accent: '#006666',
  },
  {
    id: 'link',
    icon: Link2,
    label: 'One Link',
    tag: 'SIMPLICITY',
    heading: 'One link\ndoes it all.',
    body: 'Your Drop is a single URL. Drop it in a group chat, DM, story — anywhere. No app download required for crew members. Tap the link, tap In or Out, done.',
    accent: '#FFF4BD',
  },
  {
    id: 'stats',
    icon: BarChart2,
    label: 'Drop Stats',
    tag: 'INSIGHT',
    heading: 'See the full\npicture.',
    body: 'After the Drop closes, get a breakdown — who was in, who bailed, response time. Know your crew\'s vibe for the next one.',
    accent: '#006666',
  },
  {
    id: 'privacy',
    icon: Lock,
    label: 'Private by Default',
    tag: 'SAFE',
    heading: 'Your plans\nstay yours.',
    body: 'Drops are private links — only people you share with can see them. No public feed, no algorithm, no strangers crashing your plans.',
    accent: '#FFF4BD',
  },
];

function FeatureTour() {
  const [active, setActive] = useState(0);
  const current = tourFeatures[active] ?? tourFeatures[0]!;

  return (
    <section
      style={{ background: '#1C1C1A' }}
      className="px-5 py-12 md:px-10 lg:px-20"
    >
      <style>{`
        @keyframes featureSlideIn {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .feature-detail {
          animation: featureSlideIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .tour-tab {
          position: relative;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .tour-tab::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          background: #006666;
          transition: height 0.25s ease;
          border-radius: 1px;
        }
        .tour-tab.active::before {
          height: 100%;
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div
            className="mb-4 inline-flex items-center gap-2 font-passion text-xs uppercase tracking-[0.2em]"
            style={{ color: '#006666' }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '28px',
                height: '2px',
                background: '#006666',
                borderRadius: '1px',
              }}
            />
            EVERYTHING YOU NEED
          </div>
          <h2
            className="font-passion font-bold uppercase leading-none"
            style={{ fontSize: 'clamp(36px,5.5vw,64px)', color: '#FFF4BD', letterSpacing: '-0.01em' }}
          >
            BUILT FOR THE<br />
            <span style={{ color: '#006666' }}>WAY PLANS ACTUALLY</span><br />
            HAPPEN.
          </h2>
        </div>

        {/* Body: tab list + detail panel */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">

          {/* Left: tab list */}
          <div className="flex flex-col gap-1">
            {tourFeatures.map((f, i) => {
              const Icon = f.icon;
              const isActive = active === i;
              return (
                <button
                  key={f.id}
                  onClick={() => setActive(i)}
                  className={`tour-tab ${isActive ? 'active' : ''} flex items-center gap-4 rounded-none border-0 bg-transparent px-5 py-4 text-left`}
                  style={{
                    borderLeft: `2px solid ${isActive ? '#006666' : 'rgba(255,244,189,0.08)'}`,
                    color: isActive ? '#FFF4BD' : 'rgba(255,244,189,0.35)',
                    transition: 'color 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isActive ? '#006666' : 'rgba(255,244,189,0.05)',
                      flexShrink: 0,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#FFF4BD' : 'rgba(255,244,189,0.4)'} strokeWidth={2} />
                  </div>
                  <span
                    className="font-passion text-lg uppercase tracking-wide"
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: detail panel */}
          <div
            key={current.id}
            className="feature-detail flex flex-col justify-between rounded-none p-8 lg:p-12"
            style={{
              background: '#252522',
              border: '1px solid rgba(255,244,189,0.07)',
              minHeight: '280px',
            }}
          >
            <div>
              <span
                className="font-passion text-xs uppercase tracking-[0.2em]"
                style={{ color: '#006666' }}
              >
                {current.tag}
              </span>
              <h3
                className="mt-4 font-passion font-bold uppercase leading-none"
                style={{
                  fontSize: 'clamp(32px, 4vw, 54px)',
                  color: '#FFF4BD',
                  whiteSpace: 'pre-line',
                  letterSpacing: '-0.01em',
                }}
              >
                {current.heading}
              </h3>
              <p
                className="mt-6 font-inter text-base leading-relaxed"
                style={{ color: 'rgba(255,244,189,0.5)', maxWidth: '480px' }}
              >
                {current.body}
              </p>
            </div>

            {/* Bottom decorative strip */}
            <div className="mt-10 flex items-center gap-4">
              {tourFeatures.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    height: '3px',
                    flex: 1,
                    background: i === active ? '#006666' : 'rgba(255,244,189,0.1)',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                  }}
                  aria-label={`Go to ${tourFeatures[i]?.label ?? ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    image: '/calendar-illustration.png',
    title: 'DISCOVER EVENTS',
    desc: 'Find events that match your interests.',
  },
  {
    image: '/phone-illustration.png',
    title: 'CONNECT WITH PEOPLE',
    desc: 'Join events and meet awesome people.',
  },
  {
    image: '/people-illustration.png',
    title: 'EASY BOOKING',
    desc: 'Book your spot in just a few clicks.',
  },
  {
    image: '/hand-illustration.png',
    title: 'MEMORABLE EXPERIENCES',
    desc: 'Create unforgettable memories.',
  },
];

const trustItems = [
  { icon: ShieldCheck, label: 'Secure & Safe Booking' },
  { icon: Headphones, label: '24/7 Support' },
  { icon: Smartphone, label: 'Access Anywhere' },
];

function BurstDecoration({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      width="19"
      height="39"
      viewBox="0 0 19 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-[#FFF4BD]"
      style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
    >
      <line x1="9.11839" y1="1.50001" x2="16.8885" y2="8.49312" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="1.5" y1="19.1115" x2="14.5" y2="19.1115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="9" y1="37.4902" x2="16.8787" y2="29.6115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const mounted = useMounted();
  const { dbUser, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFF4BD] text-tok-black font-inter">
      <TapokNavbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#FFF4BD]">
          <div className="flex min-h-[calc(100vh-60px)] flex-col lg:flex-row lg:items-stretch">
            <div className="relative z-10 flex flex-col items-start justify-center px-8 py-14 lg:w-[42%] lg:px-16 lg:py-20 xl:px-24">
              <h1 className="font-passion font-bold uppercase leading-none text-tok-black">
                <span className="block text-[clamp(40px,6vw,80px)]">FIND EVENTS.</span>
                <span className="block text-[clamp(40px,6vw,80px)]">JOIN PEOPLE.</span>
                <span className="block text-[clamp(40px,6vw,80px)] text-tok-teal">MAKE MEMORIES.</span>
              </h1>

              <p className="mt-5 font-inter text-lg leading-relaxed text-tok-black/70">
                Discover and book amazing events happening near you.<br />
                Connect. Participate. Enjoy.
              </p>

              {mounted && !loading && (
                <Link
                  href={dbUser ? '/drops' : '/login'}
                  className="mt-8 inline-block rounded-full bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white active:scale-[0.98]"
                  style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.04)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,102,102,0.38)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  }}
                >
                  EXPLORE EVENTS
                </Link>
              )}
              {mounted && loading && (
                <div className="mt-8 h-[52px] w-[180px] animate-pulse rounded-full bg-tok-teal/30" />
              )}
            </div>

            <div className="relative h-72 sm:h-96 lg:h-auto lg:w-[58%]">
              <Image
                src="/hero-illustration.png"
                alt="People enjoying events"
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="select-none object-contain object-center"
                style={{ mixBlendMode: 'multiply' }}
                priority
              />
            </div>
          </div>
        </section>

        {/* ── WHY USE TAPOK ── */}
        <section className="bg-tok-teal px-6 py-14 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-center gap-10">
              <BurstDecoration />
              <h2 className="font-passion text-[clamp(32px,5vw,48px)] font-bold uppercase tracking-tight text-[#FFF4BD]">
                WHY USE TAPOK?
              </h2>
              <BurstDecoration flipped />
            </div>

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {features.map(({ image, title, desc }) => (
                <div
                  key={title}
                  className="feature-card group flex flex-col items-center rounded-2xl bg-white p-6 text-center"
                  style={{
                    border: '2.5px solid transparent',
                    boxShadow: 'none',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translate(-4px, -4px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #FFF4BD';
                    (e.currentTarget as HTMLElement).style.borderColor = '#FFF4BD';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                  <div className="relative mb-6 flex h-32 w-full items-center justify-center">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="select-none object-contain"
                    />
                  </div>
                  <p className="mb-2 font-passion text-xl font-bold uppercase tracking-tight text-tok-teal">
                    {title}
                  </p>
                  <p className="font-inter text-base leading-snug text-black font-semibold">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl bg-[#004D4D] px-8 py-5 shadow-inner lg:gap-12 border border-white/5">
              {trustItems.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                    <Icon size={18} className="text-[#FFF4BD]" strokeWidth={2} />
                  </div>
                  <span className="font-passion text-sm font-bold uppercase tracking-wide text-[#FFF4BD]">
                    {label}
                  </span>
                  {i < trustItems.length - 1 && (
                    <div className="ml-6 hidden h-6 w-px bg-white/10 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW DOES TAPOK WORK ── */}
        <HowItWorks dbUser={dbUser} mounted={mounted} loading={loading} />

        {/* ── FEATURE TOUR ── */}
        <FeatureTour />
      </main>

      <footer className="bg-tok-teal px-6 md:px-16 lg:px-24">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4">
          <span className="font-passion text-lg font-bold uppercase tracking-tight text-[#FFF4BD]">TapOK</span>
          <div className="mx-4 h-4 w-px bg-[#FFF4BD]/20" />
          <p className="hidden font-inter text-sm text-[#FFF4BD]/45 md:block">Drop it. Share it. Tap in.</p>
          <div className="ml-auto flex items-center gap-6">
            {[
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="font-inter text-sm text-[#FFF4BD]/50 transition-colors hover:text-[#FFF4BD]">
                {label}
              </a>
            ))}
            <div className="h-4 w-px bg-[#FFF4BD]/20" />
            <span className="font-inter text-xs text-[#FFF4BD]/30">© {new Date().getFullYear()} TapOK</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
