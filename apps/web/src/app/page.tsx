import Image from 'next/image';
import dynamic from 'next/dynamic';
import { TapokNavbar } from '@/components/tapok-navbar';
import { CurrentYear } from '@/components/CurrentYear';
import { ShieldCheck, Headphones, Smartphone } from 'lucide-react';
import { HeroActions } from '@/components/landing/hero-actions';
import { HowItWorks } from '@/components/landing/how-it-works';

const FeatureTour = dynamic(() => import('@/components/landing/feature-tour').then(mod => mod.FeatureTour), {
  ssr: true,
  loading: () => <div className="h-96 w-full animate-pulse bg-[#1C1C1A]" />
});

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
      className="text-tok-cream"
      style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
    >
      <line x1="9.11839" y1="1.50001" x2="16.8885" y2="8.49312" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="1.5" y1="19.1115" x2="14.5" y2="19.1115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="9" y1="37.4902" x2="16.8787" y2="29.6115" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-tok-cream text-tok-black font-inter">
      <TapokNavbar />

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-tok-cream">
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

              <HeroActions />
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
              <h2 className="font-passion text-[clamp(32px,5vw,48px)] font-bold uppercase tracking-tight text-tok-cream">
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
                    <Icon size={18} className="text-tok-cream" strokeWidth={2} />
                  </div>
                  <span className="font-passion text-sm font-bold uppercase tracking-wide text-tok-cream">
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
        <HowItWorks />

        {/* ── FEATURE TOUR ── */}
        <FeatureTour />
      </main>

      <footer className="bg-tok-teal px-6 md:px-16 lg:px-24">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4">
          <span className="font-passion text-lg font-bold uppercase tracking-tight text-tok-cream">TapOK</span>
          <div className="mx-4 h-4 w-px bg-tok-cream/20" />
          <p className="hidden font-inter text-sm text-tok-cream/45 md:block">Drop it. Share it. Tap in.</p>
          <div className="ml-auto flex items-center gap-6">
            {[
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="font-inter text-sm text-tok-cream/50 transition-colors hover:text-tok-cream">
                {label}
              </a>
            ))}
            <div className="h-4 w-px bg-[#FFF4BD]/20" />
            <span className="font-inter text-xs text-[#FFF4BD]/30">© <CurrentYear /> TapOK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

