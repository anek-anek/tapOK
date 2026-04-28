'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useMounted } from '@/hooks/use-mounted';
import {
  Calendar,
  Users,
  Zap,
  Star,
  ShieldCheck,
  Headphones,
  Smartphone,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'DISCOVER EVENTS',
    desc: 'Find events that match your interests.',
  },
  {
    icon: Users,
    title: 'CONNECT WITH PEOPLE',
    desc: 'Join events and meet awesome people.',
  },
  {
    icon: Zap,
    title: 'EASY BOOKING',
    desc: 'Book your spot in just a few clicks.',
  },
  {
    icon: Star,
    title: 'MEMORABLE EXPERIENCES',
    desc: 'Create unforgettable memories.',
  },
];

const trustItems = [
  { icon: ShieldCheck, label: 'Secure & Safe Booking' },
  { icon: Headphones, label: '24/7 Support' },
  { icon: Smartphone, label: 'Access Anywhere' },
];

export default function Home() {
  const mounted = useMounted();
  const { dbUser, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFF4BD] text-[#000000] font-inter">
      <TapokNavbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#FFF4BD] px-6 pb-0 pt-10 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-0">
            {/* Left copy */}
            <div className="relative z-10 flex flex-col items-start lg:w-1/2">
              <h1 className="font-passion font-bold uppercase leading-none text-[#000000]">
                <span className="block text-[clamp(52px,7vw,96px)] leading-[1.05]">FIND EVENTS.</span>
                <span className="block text-[clamp(52px,7vw,96px)] leading-[1.05]">JOIN PEOPLE.</span>
                <span className="block text-[clamp(52px,7vw,96px)] leading-[1.05] text-[#006666]">MAKE MEMORIES.</span>
              </h1>

              <p className="mt-5 max-w-xs font-inter text-[15px] leading-relaxed text-[#000000]/70">
                Discover and book amazing events happening near you.
                Connect. Participate. Enjoy.
              </p>

              {mounted && !loading && (
                <Link
                  href={dbUser ? '/drops' : '/login'}
                  className="mt-8 inline-block rounded-md bg-[#006666] px-7 py-3.5 font-passion text-[18px] uppercase tracking-wider text-white transition-all hover:bg-[#005555] active:scale-[0.98]"
                >
                  EXPLORE EVENTS
                </Link>
              )}
              {mounted && loading && (
                <div className="mt-8 h-[52px] w-[180px] animate-pulse rounded-md bg-[#006666]/30" />
              )}
            </div>

            {/* Right illustration placeholder — hand-drawn party crowd feel */}
            <div className="relative flex w-full items-end justify-center lg:w-1/2 lg:justify-end">
              <div className="relative h-[340px] w-full max-w-[560px] select-none lg:h-[420px]">
                {/* Party scene SVG illustration */}
                <svg
                  viewBox="0 0 560 420"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full"
                  aria-hidden="true"
                >
                  {/* string lights */}
                  <path d="M20 60 Q80 40 140 60 Q200 80 260 60 Q320 40 380 60 Q440 80 500 60 Q540 50 560 55" stroke="#000" strokeWidth="2" fill="none"/>
                  {/* bulbs */}
                  {[60,140,220,300,380,460].map((x,i) => (
                    <g key={i}>
                      <line x1={x} y1="60" x2={x} y2="72" stroke="#000" strokeWidth="1.5"/>
                      <ellipse cx={x} cy="78" rx="5" ry="7" fill="#FFF4BD" stroke="#000" strokeWidth="1.5"/>
                    </g>
                  ))}

                  {/* balloons */}
                  <ellipse cx="460" cy="90" rx="22" ry="28" fill="white" stroke="#000" strokeWidth="2"/>
                  <path d="M460 118 Q463 128 460 135" stroke="#000" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="500" cy="75" rx="18" ry="23" fill="#FFF4BD" stroke="#000" strokeWidth="2"/>
                  <path d="M500 98 Q503 108 500 115" stroke="#000" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="430" cy="105" rx="16" ry="20" fill="white" stroke="#000" strokeWidth="2"/>

                  {/* shelf / table background */}
                  <rect x="340" y="130" width="200" height="8" rx="2" fill="#000"/>
                  <rect x="330" y="105" width="8" height="30" rx="2" fill="#000"/>
                  <rect x="532" y="105" width="8" height="30" rx="2" fill="#000"/>
                  {/* plant */}
                  <rect x="352" y="110" width="22" height="22" rx="3" fill="#006666"/>
                  <path d="M363 110 Q355 90 348 82" stroke="#006666" strokeWidth="2.5" fill="none"/>
                  <path d="M363 110 Q370 88 375 80" stroke="#006666" strokeWidth="2.5" fill="none"/>
                  <path d="M363 110 Q363 94 363 85" stroke="#006666" strokeWidth="2.5" fill="none"/>
                  {/* vinyl */}
                  <circle cx="510" cy="118" r="16" fill="#000"/>
                  <circle cx="510" cy="118" r="5" fill="#FFF4BD"/>
                  <circle cx="510" cy="118" r="2" fill="#000"/>

                  {/* DJ table */}
                  <rect x="395" y="195" width="140" height="12" rx="3" fill="#000"/>
                  <rect x="400" y="175" width="130" height="22" rx="4" fill="#333"/>
                  <circle cx="430" cy="186" r="8" fill="#555"/>
                  <circle cx="430" cy="186" r="3" fill="#999"/>
                  <circle cx="460" cy="186" r="8" fill="#555"/>
                  <circle cx="460" cy="186" r="3" fill="#999"/>
                  <rect x="478" y="180" width="40" height="12" rx="2" fill="#006666" opacity="0.8"/>

                  {/* beer pong table */}
                  <rect x="100" y="240" width="200" height="10" rx="3" fill="#000"/>
                  {[120,145,170,195,220,245,270].map((x,i)=>(
                    <circle key={i} cx={x} cy="232" r="8" fill="white" stroke="#000" strokeWidth="1.5"/>
                  ))}
                  {[133,158,183,208,233,258].map((x,i)=>(
                    <circle key={i} cx={x} cy="217" r="8" fill="white" stroke="#000" strokeWidth="1.5"/>
                  ))}
                  {[145,170,195,220,245].map((x,i)=>(
                    <circle key={i} cx={x} cy="202" r="8" fill="white" stroke="#000" strokeWidth="1.5"/>
                  ))}

                  {/* Table legs */}
                  <rect x="110" y="250" width="8" height="50" fill="#000"/>
                  <rect x="280" y="250" width="8" height="50" fill="#000"/>

                  {/* floor */}
                  <rect x="0" y="360" width="560" height="60" fill="#006666" opacity="0.08" rx="4"/>

                  {/* People silhouettes - simplified hand-drawn style */}
                  {/* person 1 - dancing left */}
                  <g transform="translate(60,180)">
                    <circle cx="0" cy="0" r="16" fill="white" stroke="#000" strokeWidth="2"/>
                    {/* face details */}
                    <circle cx="-5" cy="-2" r="2" fill="#000"/>
                    <circle cx="5" cy="-2" r="2" fill="#000"/>
                    <path d="M-4 5 Q0 9 4 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    {/* curly hair */}
                    <path d="M-14 -4 Q-18 -16 -8 -18 Q0 -22 8 -18 Q18 -16 14 -4" stroke="#000" strokeWidth="2" fill="none"/>
                    {/* body */}
                    <rect x="-14" y="18" width="28" height="40" rx="6" fill="#000"/>
                    {/* arms raised */}
                    <path d="M-14 28 Q-30 15 -38 8" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M14 28 Q28 20 22 8" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    {/* legs */}
                    <path d="M-5 58 Q-12 75 -20 90" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M5 58 Q10 75 15 90" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  </g>

                  {/* person 2 - cap */}
                  <g transform="translate(145,170)">
                    <circle cx="0" cy="0" r="16" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-5" cy="-2" r="2" fill="#000"/>
                    <circle cx="5" cy="-2" r="2" fill="#000"/>
                    <path d="M-4 5 Q0 8 4 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    {/* cap */}
                    <rect x="-12" y="-18" width="24" height="10" rx="5" fill="#000"/>
                    <rect x="-16" y="-10" width="32" height="4" rx="2" fill="#000"/>
                    <rect x="-8" y="18" width="22" height="40" rx="6" fill="white" stroke="#000" strokeWidth="1.5"/>
                    <path d="M-8 28 Q-22 22 -28 15" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M14 28 Q24 18 30 22" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M-2 58 Q-6 76 -10 92" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M8 58 Q12 76 16 92" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  </g>

                  {/* person 3 - center dancing */}
                  <g transform="translate(230,165)">
                    <circle cx="0" cy="0" r="16" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-5" cy="-2" r="2" fill="#000"/>
                    <circle cx="5" cy="-2" r="2" fill="#000"/>
                    <path d="M-4 6 Q0 10 4 6" stroke="#000" strokeWidth="1.5" fill="none"/>
                    {/* hair */}
                    <path d="M-16 -6 Q-14 -22 0 -22 Q14 -22 16 -6" stroke="#000" strokeWidth="2" fill="#000"/>
                    <rect x="-13" y="18" width="26" height="42" rx="6" fill="#006666"/>
                    <path d="M-13 25 Q-28 32 -32 42" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M13 25 Q32 18 36 30" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M-4 60 Q-8 78 -14 95" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M6 60 Q12 78 18 95" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  </g>

                  {/* person 4 - right side */}
                  <g transform="translate(310,175)">
                    <circle cx="0" cy="0" r="16" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-5" cy="-2" r="2" fill="#000"/>
                    <circle cx="5" cy="-2" r="2" fill="#000"/>
                    <path d="M-4 5 Q0 9 4 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    {/* beanie */}
                    <rect x="-14" y="-20" width="28" height="16" rx="8" fill="#000"/>
                    <rect x="-14" y="-6" width="28" height="5" fill="#333"/>
                    <rect x="-12" y="18" width="24" height="40" rx="6" fill="white" stroke="#000" strokeWidth="1.5"/>
                    <path d="M-12 26 Q-26 18 -30 8" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M12 26 Q22 22 26 12" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M-3 58 Q-7 76 -12 92" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                    <path d="M5 58 Q9 76 14 92" stroke="#000" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  </g>

                  {/* seated people on bench (right) */}
                  {/* bench */}
                  <rect x="380" y="250" width="160" height="10" rx="4" fill="#000"/>
                  <rect x="385" y="260" width="8" height="40" fill="#000"/>
                  <rect x="527" y="260" width="8" height="40" fill="#000"/>

                  {/* seated person 1 */}
                  <g transform="translate(410,210)">
                    <circle cx="0" cy="0" r="14" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-4" cy="-1" r="2" fill="#000"/>
                    <circle cx="4" cy="-1" r="2" fill="#000"/>
                    <path d="M-3 5 Q0 8 3 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    <rect x="-12" y="16" width="24" height="28" rx="5" fill="#000"/>
                    <path d="M-12 22 Q-22 20 -24 28" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M12 22 Q22 20 24 16" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M-4 44 L-4 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M4 44 L4 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                  </g>

                  {/* seated person 2 */}
                  <g transform="translate(465,205)">
                    <circle cx="0" cy="0" r="14" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-4" cy="-1" r="2" fill="#000"/>
                    <circle cx="4" cy="-1" r="2" fill="#000"/>
                    <path d="M-3 5 Q0 8 3 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    <path d="M-12 -10 Q0 -22 12 -10" stroke="#000" strokeWidth="2" fill="none"/>
                    <rect x="-12" y="16" width="24" height="28" rx="5" fill="white" stroke="#000" strokeWidth="1.5"/>
                    <path d="M-12 22 Q-20 16 -18 8" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M12 22 Q20 18 22 28" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M-4 44 L-4 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M4 44 L4 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                  </g>

                  {/* DJ person */}
                  <g transform="translate(510,155)">
                    <circle cx="0" cy="0" r="14" fill="white" stroke="#000" strokeWidth="2"/>
                    <circle cx="-4" cy="-1" r="2" fill="#000"/>
                    <circle cx="4" cy="-1" r="2" fill="#000"/>
                    <path d="M-3 5 Q0 8 3 5" stroke="#000" strokeWidth="1.5" fill="none"/>
                    <rect x="-12" y="16" width="24" height="30" rx="5" fill="#000"/>
                    <path d="M-12 20 Q-22 26 -26 36" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M12 20 Q20 24 22 34" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M-3 46 L-3 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M5 46 L5 58" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                  </g>

                  {/* music notes */}
                  <text x="30" y="155" fontSize="20" fill="#000" opacity="0.4">♪</text>
                  <text x="355" y="148" fontSize="16" fill="#000" opacity="0.4">♫</text>
                  <text x="540" y="135" fontSize="18" fill="#000" opacity="0.4">♪</text>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY USE TAPOK ── */}
        <section className="bg-[#006666] px-6 py-14 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl">
            {/* Section heading with decorative sparkles */}
            <div className="mb-10 flex items-center justify-center gap-3">
              <span className="text-[#FFF4BD] text-xl select-none">✦</span>
              <h2 className="font-passion text-[clamp(28px,4vw,42px)] font-bold uppercase tracking-wide text-[#FFF4BD]">
                WHY USE TAPOK?
              </h2>
              <span className="text-[#FFF4BD] text-xl select-none">✦</span>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#000]/10 bg-[#FFF4BD]">
                    <Icon size={28} strokeWidth={1.5} className="text-[#000]" />
                  </div>
                  <p className="mb-2 font-passion text-[15px] font-bold uppercase tracking-wide text-[#006666]">
                    {title}
                  </p>
                  <p className="font-inter text-[13px] leading-snug text-[#000]/60">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-4">
              {trustItems.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={16} className="text-[#FFF4BD]" strokeWidth={1.5} />
                  <span className="font-inter text-[13px] font-medium text-[#FFF4BD]">{label}</span>
                  {i < trustItems.length - 1 && (
                    <span className="ml-4 hidden text-white/30 sm:inline">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
