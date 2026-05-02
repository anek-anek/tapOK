'use client';

import { useState } from 'react';
import { Zap, Users, Bell, Link2, BarChart2, Lock } from 'lucide-react';

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
    heading: "Always know\nwho's in.",
    body: "Watch your headcount update in real time as crew taps in. No polling threads, no \"did you see my message?\" — just a clean, live list of who's actually showing up.",
    accent: '#F7E9B2',
  },
  {
    id: 'nudge',
    icon: Bell,
    label: 'Auto Nudges',
    tag: 'NO CHASE',
    heading: 'Stop chasing\npeople down.',
    body: "TapOK pings the fence-sitters so you don't have to. Automated reminders go out before the Drop closes — you stay the Chief, not the nag.",
    accent: '#006666',
  },
  {
    id: 'link',
    icon: Link2,
    label: 'One Link',
    tag: 'SIMPLICITY',
    heading: 'One link\ndoes it all.',
    body: 'Your Drop is a single URL. Drop it in a group chat, DM, story — anywhere. No app download required for crew members. Tap the link, tap In or Out, done.',
    accent: '#F7E9B2',
  },
  {
    id: 'stats',
    icon: BarChart2,
    label: 'Drop Stats',
    tag: 'INSIGHT',
    heading: 'See the full\npicture.',
    body: "After the Drop closes, get a breakdown — who was in, who bailed, response time. Know your crew's vibe for the next one.",
    accent: '#006666',
  },
  {
    id: 'privacy',
    icon: Lock,
    label: 'Private by Default',
    tag: 'SAFE',
    heading: 'Your plans\nstay yours.',
    body: 'Drops are private links — only people you share with can see them. No public feed, no algorithm, no strangers crashing your plans.',
    accent: '#F7E9B2',
  },
];

export function FeatureTour() {
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
            style={{ fontSize: 'clamp(36px,5.5vw,64px)', color: '#F7E9B2', letterSpacing: '-0.01em' }}
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
                    borderLeft: `2px solid ${isActive ? '#006666' : 'rgba(247,233,178,0.08)'}`,
                    color: isActive ? '#F7E9B2' : 'rgba(247,233,178,0.35)',
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
                      background: isActive ? '#006666' : 'rgba(247,233,178,0.05)',
                      flexShrink: 0,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#F7E9B2' : 'rgba(247,233,178,0.4)'} strokeWidth={2} />
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
              border: '1px solid rgba(247,233,178,0.07)',
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
                  color: '#F7E9B2',
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
                    background: i === active ? '#006666' : 'rgba(247,233,178,0.1)',
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
