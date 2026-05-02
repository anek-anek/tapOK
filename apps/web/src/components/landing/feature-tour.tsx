'use client';

import { useState } from 'react';
import {
  CalendarPlus,
  Link2,
  Users,
  Sparkles,
  Activity,
  Flame,
} from 'lucide-react';

const tourFeatures = [
  {
    id: 'create',
    icon: CalendarPlus,
    label: 'Create Drops',
    tag: 'CHIEF',
    heading: 'Build a Drop\nin minutes.',
    body: 'Set the name, time, and place. Pick a category, add a cover, and an optional headcount. Lock the roster if you want to approve who joins — you stay in control as Chief.',
    tabBg: 'bg-tok-teal',
    tabIcon: 'text-tok-cream',
  },
  {
    id: 'join',
    icon: Link2,
    label: 'Join links',
    tag: 'SHARE',
    heading: 'One link.\nEveryone taps in.',
    body: 'Each Drop gets a join code and shareable URL. Crew opens it, signs in when needed, and taps In or Out. Private Drops stay off the public feed unless you mark them public.',
    tabBg: 'bg-tok-black',
    tabIcon: 'text-tok-cream',
  },
  {
    id: 'crew',
    icon: Users,
    label: 'Live roster',
    tag: 'ROSTER',
    heading: "See who's actually\nshowing up.",
    body: 'The crew list updates with who’s in, out, or waiting on a locked Drop. When it’s go-time, members can mark presence so you’re not guessing headcounts.',
    tabBg: 'bg-tok-teal',
    tabIcon: 'text-tok-cream',
  },
  {
    id: 'discover',
    icon: Sparkles,
    label: 'Discover',
    tag: 'FEED',
    heading: 'Browse public\nDrops.',
    body: 'Discover surfaces Drops that are public — skim featured picks, filter by category, and find plans worth joining without digging through group chats.',
    tabBg: 'bg-tok-black',
    tabIcon: 'text-tok-cream',
  },
  {
    id: 'activity',
    icon: Activity,
    label: 'Activity',
    tag: 'LOG',
    heading: 'Everything that\nhappened.',
    body: 'Your Activity view lines up creates, joins, status changes, and other moments across your Drops — a single timeline instead of scattered notifications.',
    tabBg: 'bg-tok-teal',
    tabIcon: 'text-tok-cream',
  },
  {
    id: 'moments',
    icon: Flame,
    label: 'Sparks & photos',
    tag: 'LIVE',
    heading: 'Energy + the\nphoto roll.',
    body: 'Send Sparks when the vibe spikes. The photo roll captures the night — featured shots stay visible, and the rest is tidied up automatically when a Drop completes.',
    tabBg: 'bg-tok-black',
    tabIcon: 'text-tok-cream',
  },
] as const;

export function FeatureTour() {
  const [active, setActive] = useState(0);
  const current = tourFeatures[active] ?? tourFeatures[0]!;

  return (
    <section className="border-t-[3px] border-tok-black bg-tok-cream px-5 py-14 md:px-10 lg:px-20">
      <style>{`
        @keyframes featureSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .feature-detail {
          animation: featureSlideIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-center text-center md:mb-12">
          <div
            className="mb-4 inline-flex items-center border-[3px] border-tok-black bg-tok-teal px-4 py-1.5 font-passion text-[11px] font-bold uppercase tracking-[0.18em] text-tok-cream shadow-[3px_3px_0_#000]"
          >
            IN THE APP TODAY
          </div>
          <h2 className="font-passion text-[clamp(32px,5.5vw,56px)] font-bold uppercase leading-[1.05] tracking-tight text-tok-black">
            WHAT TAPOK
            <br />
            <span className="text-tok-teal">ACTUALLY DOES.</span>
          </h2>
          <p className="mt-4 max-w-lg font-inter text-base text-tok-black/55">
            Real features from the live product — not a roadmap teaser.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-10">
          <div className="flex flex-col gap-2">
            {tourFeatures.map((f, i) => {
              const Icon = f.icon;
              const isActive = active === i;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-3 rounded border-[3px] px-4 py-3.5 text-left transition-[transform,box-shadow,background-color] duration-150 ease-out ${
                    isActive
                      ? 'border-tok-black bg-tok-white shadow-[5px_5px_0_#000]'
                      : 'border-tok-black/15 bg-tok-white/60 shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-tok-black/40 hover:shadow-[4px_4px_0_#000]'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border-[3px] border-tok-black ${f.tabBg}`}
                  >
                    <Icon className={f.tabIcon} size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-passion text-base uppercase tracking-wide text-tok-black">
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            key={current.id}
            className="feature-detail flex flex-col justify-between border-[3px] border-tok-black bg-tok-white p-8 shadow-[8px_8px_0_#000] lg:p-10"
          >
            <div>
              <span className="font-passion text-xs font-bold uppercase tracking-[0.2em] text-tok-teal">
                {current.tag}
              </span>
              <h3 className="mt-4 font-passion text-[clamp(28px,3.8vw,44px)] font-bold uppercase leading-[1.05] tracking-tight text-tok-black whitespace-pre-line">
                {current.heading}
              </h3>
              <p className="mt-6 max-w-lg font-inter text-base leading-relaxed font-medium text-tok-black/65">
                {current.body}
              </p>
            </div>

            <div className="mt-10 flex items-center gap-2">
              {tourFeatures.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-2 flex-1 rounded-sm border-2 border-tok-black transition-colors ${
                    i === active ? 'bg-tok-teal' : 'bg-tok-cream hover:bg-tok-cream-dim'
                  }`}
                  aria-label={`Show feature ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
