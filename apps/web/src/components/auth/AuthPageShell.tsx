'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export const authInputClass =
  'w-full border-2 border-black bg-tok-cream px-4 py-3 text-sm text-black placeholder-black/30 outline-hidden transition-all duration-150 ease-in-out focus:bg-white focus:shadow-[4px_4px_0_#000] focus:ring-0 hover:border-tok-teal font-inter rounded-none';

type AuthFormFieldProps = {
  label: string;
  error?: string;
  animClass?: string;
  children: ReactNode;
};

export function AuthFormField({ label, error, animClass = '', children }: AuthFormFieldProps) {
  return (
    <div className={`flex w-full flex-col gap-1.5 ${animClass}`}>
      <label
        className="font-passion text-xs uppercase tracking-[0.12em] text-black/60"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="animate-fade-up font-inter text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type AuthPageShellProps = {
  children: ReactNode;
  footerClassName?: string;
};

const socialProofItems = [
  { num: '01', label: 'DROP A PLAN.' },
  { num: '02', label: 'SPREAD THE WORD.' },
  { num: '03', label: 'TAP IN. NO MAYBES.' },
];

export function AuthPageShell({ children, footerClassName = 'animate-fade-in' }: AuthPageShellProps) {
  return (
    <div className="flex min-h-dvh bg-tok-cream lg:min-h-screen">
      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes authPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .auth-panel-in {
          animation: authFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .auth-right-in {
          animation: authSlideIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        .auth-live-dot {
          animation: authPulse 2s ease-in-out infinite;
        }
        .tapok-btn {
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .tapok-btn:not([disabled]):hover {
          transform: translateY(-6px) scale(1.04);
          box-shadow: 0 16px 32px rgba(0,102,102,0.45);
          background-color: #005555;
        }
        .tapok-btn:not([disabled]):active {
          transform: scale(0.98);
          box-shadow: none;
        }
        .tapok-btn[disabled] {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>

      {/* ── LEFT: Form panel ── */}
      <div className="auth-panel-in flex w-full flex-col justify-between bg-tok-cream px-5 py-6 sm:px-8 sm:py-8 lg:w-[48%] lg:px-14 lg:py-10 border-r-0 lg:border-r-2 lg:border-black">

        {/* Logo */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 font-passion text-xl leading-none tracking-tight text-black sm:text-2xl"
          style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px) scale(1.04)';
            (e.currentTarget as HTMLElement).style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tok-teal text-xl text-tok-cream">
            TAP
          </span>
          <span>OK</span>
        </Link>

        {/* Form content */}
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8 sm:max-w-[420px]">
          {children}
        </div>

        <p className={`${footerClassName} font-inter text-xs text-black/25`}>
          © 2026 TapOK. Plans that actually happen.
        </p>
      </div>

      {/* ── RIGHT: Brand panel ── */}
      <div
        className="auth-right-in hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#1C1C1A] p-12 xl:p-16"
      >
        {/* Top tag */}
        <div className="flex items-center gap-3">
          <span
            className="auth-live-dot inline-block h-2 w-2 rounded-full bg-tok-teal"
          />
          <span
            className="font-passion text-xs uppercase tracking-[0.2em] text-tok-cream/40"
          >
            TAPOK IS LIVE
          </span>
        </div>

        {/* Hero text */}
        <div>
          <p
            className="font-passion font-bold uppercase leading-none text-tok-cream"
            style={{ fontSize: 'clamp(40px, 4.5vw, 72px)', letterSpacing: '-0.01em' }}
          >
            MAKE PLANS.
            <br />
            TAP IN.
            <br />
            <span style={{ color: '#006666' }}>SHOW UP.</span>
          </p>

          <p className="mt-6 font-inter text-sm leading-relaxed text-tok-cream/45 max-w-xs">
            One Chief. One Drop. Real headcount — no maybes, no ghost replies, no chaos.
          </p>

          {/* Step cards */}
          <div className="mt-10 flex flex-col gap-3">
            {socialProofItems.map((item, i) => (
              <div
                key={item.num}
                className="flex items-center gap-4"
                style={{
                  opacity: 0,
                  animation: `authFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.1}s both`,
                }}
              >
                <span
                  className="font-passion text-xs font-bold text-tok-teal"
                  style={{ letterSpacing: '0.08em' }}
                >
                  {item.num}
                </span>
                <div
                  className="flex-1 border-t-2 border-dashed"
                  style={{ borderColor: 'rgba(255,244,189,0.08)' }}
                />
                <span
                  className="font-passion text-sm uppercase tracking-wider text-tok-cream/60"
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent strip */}
        <div className="flex items-center gap-4">
          <div
            className="h-1 flex-1"
            style={{ background: '#006666', boxShadow: '0 0 12px rgba(0,102,102,0.6)' }}
          />
          <span className="font-passion text-xs uppercase tracking-[0.15em] text-tok-cream/20">
            DROP IT. SHARE IT. TAP IN.
          </span>
          <div
            className="h-1 w-8"
            style={{ background: 'var(--color-tok-cream)', opacity: 0.12 }}
          />
        </div>
      </div>
    </div>
  );
}
