'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import { AdminUsersTab } from '@/components/admin/admin-users-tab';
import { AdminDropsTab } from '@/components/admin/admin-drops-tab';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { dbUser, isReady, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'drops'>('users');

  useEffect(() => {
    if (isReady && (!dbUser || dbUser.role !== 'admin')) {
      router.replace('/drops');
    }
  }, [isReady, dbUser, router]);

  if (!isReady || loading || !dbUser || dbUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-tok-cream text-tok-black">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <PageBackdropWatermark label="ADMIN" />

      <main className="relative z-1 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 pb-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-tok-teal" size={24} />
            <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
              COMMAND CENTER
            </p>
          </div>
          <h1 className="font-passion text-[clamp(32px,8vw,80px)] font-black uppercase leading-[0.85] tracking-tight text-tok-black">
            ADMIN <span className="text-tok-teal">PANEL.</span>
          </h1>
        </div>

        {/* Tab Strip */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-sm border-[3px] border-tok-black font-passion text-sm font-bold uppercase tracking-[2px] transition-all shadow-[4px_4px_0px_#1C1C1A]',
              activeTab === 'users'
                ? 'bg-tok-black text-tok-cream translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]'
            )}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('drops')}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-sm border-[3px] border-tok-black font-passion text-sm font-bold uppercase tracking-[2px] transition-all shadow-[4px_4px_0px_#1C1C1A]',
              activeTab === 'drops'
                ? 'bg-tok-black text-tok-cream translate-x-0.5 translate-y-0.5 shadow-none'
                : 'bg-white text-tok-black hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]'
            )}
          >
            Drops
          </button>
        </div>

        {/* Content */}
        {activeTab === 'users' ? <AdminUsersTab /> : <AdminDropsTab />}
      </main>
    </div>
  );
}
