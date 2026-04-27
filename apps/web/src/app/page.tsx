'use client';

import { useHealth } from '@/hooks/queries/use-health';
import { TapokNavbar } from '@/components/tapok-navbar';
import {
  Database,
  ShieldCheck,
  LayoutGrid,
  Terminal,
  ArrowRight,
  Braces,
  Zap,
  Globe,
  Lock,
  Box,
} from 'lucide-react';

const stack = [
  { icon: Box, name: 'NestJS 11', desc: 'Modular backend with guards, pipes, and decorators', color: 'text-red-400' },
  { icon: Globe, name: 'Next.js 16', desc: 'App Router with React 19 and Turbopack', color: 'text-stone-500' },
  { icon: Lock, name: 'Firebase Auth', desc: 'Identity layer with custom claims and token sync', color: 'text-amber-500' },
  { icon: Database, name: 'TypeORM + PostgreSQL', desc: 'Type-safe entities, migrations, and repositories', color: 'text-blue-400' },
  { icon: Zap, name: 'TanStack Query v5', desc: 'Server state, caching, and mutation lifecycle', color: 'text-rose-400' },
  { icon: LayoutGrid, name: 'shadcn/ui + Tailwind', desc: 'Accessible component library with design tokens', color: 'text-stone-400' },
  { icon: ShieldCheck, name: 'RBAC with Guards', desc: 'Role-based access via NestJS guards and decorators', color: 'text-emerald-500' },
  { icon: Braces, name: 'OpenAPI / Scalar', desc: 'Auto-generated types shared across the monorepo', color: 'text-violet-400' },
];

const commands = [
  { cmd: 'npm run dev:all', desc: 'Start all apps (API + Web)' },
  { cmd: 'npm run dev:api', desc: 'NestJS backend only' },
  { cmd: 'npm run dev:web', desc: 'Next.js frontend only' },
  { cmd: 'npm run migration:generate <Name>', desc: 'Generate migration' },
  { cmd: 'npm run migration:run', desc: 'Run pending migrations' },
  { cmd: 'npm run generate:api', desc: 'Regenerate @repo/api types' },
  { cmd: 'npm run lint:all', desc: 'Lint across workspace' },
  { cmd: 'npm run typecheck:all', desc: 'Type check across workspace' },
];

export default function Home() {
  const health = useHealth();

  return (
    <div className="min-h-screen bg-[#EDECE8] text-[#2a2118] selection:bg-[#2a2118]/10">

      {/* subtle dot grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #2a2118 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <TapokNavbar active="home" />

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2118]/12 bg-[#F7E9B2] px-4 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full transition-colors ${health === 'up' ? 'bg-emerald-500' : health === 'down' ? 'bg-red-500' : 'bg-[#2a2118]/50'}`} />
            <span className="font-mono text-xs text-[#2a2118]/50">v1.0 · production-ready template</span>
          </div>

          <h1 className="mb-4 font-mono text-6xl font-bold tracking-tight text-[#2a2118] max-sm:text-4xl">
            Formesean<br />
            <span className="text-[#2a2118]/25">Stack</span>
          </h1>

          <p className="mb-10 max-w-md font-mono text-sm leading-relaxed text-[#2a2118]/50">
            A Turborepo monorepo starter for SaaS — NestJS backend, Next.js frontend,
            PostgreSQL DB, Firebase Auth, end-to-end type safety, and RBAC out of the box.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/formesean/formesean-stack"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg bg-[#2a2118] px-5 py-2.5 font-mono text-sm font-semibold text-[#F7E9B2] transition-all hover:bg-[#2a2118]/85"
            >
              Use this template
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            {process.env.NODE_ENV !== 'production' && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/docs`}
                className="flex items-center gap-2 rounded-lg border border-[#2a2118]/15 bg-[#EDECE8]/60 px-5 py-2.5 font-mono text-sm text-[#2a2118]/55 transition-all hover:border-[#2a2118]/25 hover:bg-[#EDECE8] hover:text-[#2a2118]"
              >
                <Braces size={15} />
                View API Docs
              </a>
            )}
          </div>
        </section>

        {/* ── TECH STACK ── */}
        <section className="border-t border-[#2a2118]/8 px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 flex items-center gap-4">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2a2118]/30">Tech Stack</span>
              <div className="h-px flex-1 bg-[#2a2118]/8" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stack.map(({ icon: Icon, name, desc, color }) => (
                <div
                  key={name}
                  className="group rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/60 p-5 transition-all hover:border-[#2a2118]/15 hover:bg-[#F7E9B2]"
                >
                  <Icon size={22} className={`mb-3 ${color} opacity-70 transition-opacity group-hover:opacity-100`} />
                  <p className="mb-1 font-mono text-sm font-semibold text-[#2a2118]/80">{name}</p>
                  <p className="font-mono text-xs leading-relaxed text-[#2a2118]/40">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEV COMMANDS ── */}
        <section className="border-t border-[#2a2118]/8 px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 flex items-center gap-4">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2a2118]/30">Dev Commands</span>
              <div className="h-px flex-1 bg-[#2a2118]/8" />
            </div>
            <div className="overflow-hidden rounded-xl border border-[#2a2118]/8 bg-[#F7E9B2]/50">
              <div className="flex items-center gap-1.5 border-b border-[#2a2118]/8 px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2a2118]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#2a2118]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#2a2118]/15" />
                <span className="ml-3 font-mono text-xs text-[#2a2118]/25">terminal</span>
              </div>
              <div className="divide-y divide-[#2a2118]/6">
                {commands.map(({ cmd, desc }) => (
                  <div
                    key={cmd}
                    className="group flex items-center gap-6 px-5 py-3.5 transition-colors hover:bg-[#F7E9B2]/60"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Terminal size={13} className="shrink-0 text-[#2a2118]/25" />
                      <code className="truncate font-mono text-sm text-[#2a2118]/60 group-hover:text-[#2a2118]">
                        {cmd}
                      </code>
                    </div>
                    <span className="hidden shrink-0 font-mono text-xs text-[#2a2118]/30 sm:block">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-[#2a2118]/8 px-8 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-mono text-xs text-[#2a2118]/25">formesean-stack</span>
          <span className="font-mono text-xs text-[#2a2118]/25">MIT License</span>
        </div>
      </footer>
    </div>
  );
}
