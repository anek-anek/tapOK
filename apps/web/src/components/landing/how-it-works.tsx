'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useMounted } from '@/hooks/use-mounted';

const SHARE_CARD_INK = '#3a3a36';

const flipSteps = [
  {
    id: 'plan',
    num: '01',
    teaser: 'DROP A\nPLAN.',
    accentBg: '#006666',
    accentText: '#F7E9B2',
    backBg: '#F7E9B2',
    backBorder: '#006666',
    heading: 'Be the Chief.',
    body: "Pin a name, a time, and a place. Give your crew one clear thing to say yes or no to — no group-chat chaos, no back-and-forth.",
    tag: 'YOU START IT',
    backTextColor: '#000',
    backBodyColor: 'rgba(0,0,0,0.6)',
    backHintColor: 'rgba(0,0,0,0.25)',
    tagBg: '#006666',
    tagText: '#F7E9B2',
  },
  {
    id: 'share',
    num: '02',
    teaser: 'SPREAD\nTHE WORD.',
    accentBg: SHARE_CARD_INK,
    accentText: '#F7E9B2',
    backBg: '#F7E9B2',
    backBorder: SHARE_CARD_INK,
    frame: SHARE_CARD_INK,
    heading: 'One link. Everywhere.',
    body: "Your Drop goes live instantly. Blast the link wherever the chaos usually starts — group chat, DMs, anywhere. One tap and they're in.",
    tag: 'SHARE IT',
    backTextColor: SHARE_CARD_INK,
    backBodyColor: 'rgba(58,58,54,0.62)',
    backHintColor: 'rgba(58,58,54,0.28)',
    tagBg: SHARE_CARD_INK,
    tagText: '#F7E9B2',
  },
  {
    id: 'live',
    num: '03',
    teaser: 'TAP IN.\nNO MAYBES.',
    accentBg: '#F7E9B2',
    accentText: '#006666',
    backBg: '#006666',
    backBorder: '#006666',
    heading: 'Live headcount.',
    body: "Crew taps In or Out. You get a live roster instantly — no awkward follow-ups, no buried DMs, just a clear count so the plan actually happens.",
    tag: 'DONE.',
    backTextColor: '#F7E9B2',
    backBodyColor: 'rgba(247,233,178,0.75)',
    backHintColor: 'rgba(247,233,178,0.4)',
    tagBg: '#F7E9B2',
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
  const frame = 'frame' in step && step.frame ? step.frame : '#000';

  return (
    <div
      className="flip-card-wrapper animate-card-entrance"
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
            border: `3px solid ${frame}`,
            boxShadow: `6px 6px 0px ${frame}`,
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
              fontFamily: 'var(--font-passion, "Passion One", sans-serif)',
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
                fontFamily: 'var(--font-passion, "Passion One", sans-serif)',
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
            boxShadow: `6px 6px 0px ${frame}`,
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
              fontFamily: 'var(--font-passion, "Passion One", sans-serif)',
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
                fontFamily: 'var(--font-passion, "Passion One", sans-serif)',
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

export function HowItWorks() {
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const toggle = (i: number) => setFlipped((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  
  const { dbUser, loading } = useAuth();

  return (
    <section className="bg-tok-cream px-5 py-12 md:px-10 lg:px-20">
      <style>{`
        .flip-card-wrapper {
          height: 300px;
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
              color: '#F7E9B2',
              fontFamily: 'var(--font-passion, "Passion One", sans-serif)',
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

        {(!loading || dbUser) && (
          <div className="mt-14 flex flex-col items-center gap-3">
            <Link
              href={dbUser ? '/drops/create' : '/login'}
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
