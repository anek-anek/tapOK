'use client';

import React, { useState } from 'react';
import { useFeedback, FeedbackType } from '@/hooks/queries/use-feedback';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { PageBackdropWatermark } from '@/components/page-backdrop-watermark';
import { cn } from '@/lib/utils';
import {
    Radio,
    Sparkles,
    ShieldAlert,
    Plus,
    Filter,
    Loader2,
    Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function SectionHeading({
    icon: Icon,
    title,
    sub,
    className,
}: {
    icon: any;
    title: string;
    sub?: string;
    className?: string;
}) {
    return (
        <div className={cn('mb-8 flex flex-col gap-2', className)}>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A]">
                    <Icon size={20} className="text-tok-black" strokeWidth={2.5} />
                </div>
                <div>
                    <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-teal">
                        {sub || 'System Signal'}
                    </p>
                    <h2 className="font-passion text-3xl font-black uppercase tracking-tight text-tok-black leading-none mt-1">
                        {title}
                    </h2>
                </div>
            </div>
        </div>
    );
}

export function SignalTowerClient() {
    const [activeTab, setActiveTab] = useState<FeedbackType | undefined>(undefined);
    const [showDialog, setShowDialog] = useState(false);
    const { data: feedbackItems, isLoading, isError } = useFeedback(activeTab);

    const TABS = [
        { id: undefined, label: 'ALL' },
        { id: 'feature', label: 'UPGRADES' },
        { id: 'bug', label: 'MALFUNCTIONS' },
    ];

    return (
        <div className="relative min-h-screen bg-tok-cream text-tok-black">
            {/* Background flourish */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-tok-black) 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                }}
            />

            <PageBackdropWatermark label="SIGNAL TOWER" />

            <main className="relative z-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16 lg:px-10 pb-24">
                {/* Header Row */}
                <div className="mb-16 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="animate-fade-up">
                        <p className="font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-teal">
                            OPERATIONAL HUB
                        </p>
                        <h1 className="font-passion whitespace-nowrap text-[clamp(48px,9vw,84px)] font-black uppercase leading-[0.85] tracking-tight text-tok-black">
                            SIGNAL <span className="text-tok-teal">TOWER.</span>
                        </h1>
                    </div>

                    <button
                        onClick={() => setShowDialog(true)}
                        className="flex h-12 w-full items-center justify-center gap-3 whitespace-nowrap rounded-sm border-[3px] border-tok-black bg-tok-teal px-8 font-passion text-xs font-bold uppercase tracking-[2px] text-tok-cream shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none lg:w-auto"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        New Transmission
                    </button>
                </div>

                {/* Filters and Feed */}
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <SectionHeading
                            icon={Filter}
                            title="Signal Stream"
                            sub="Active operational frequencies"
                            className="mb-0"
                        />

                        {/* Tab Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={String(tab.id)}
                                        onClick={() => setActiveTab(tab.id as FeedbackType)}
                                        className={cn(
                                            "flex h-10 shrink-0 items-center gap-3 px-4 rounded-sm border-[3px] font-passion text-[11px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-tok-black text-tok-cream border-tok-black shadow-[4px_4px_0px_#1C1C1A]"
                                                : "bg-white text-tok-black border-tok-black hover:bg-tok-black/5"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="mt-8 relative min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 w-full rounded-sm border-[3px] border-tok-black/10 bg-white/50 animate-pulse p-6" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-[4px] border-dashed border-tok-black/10">
                                <ShieldAlert size={48} className="text-red-500 mb-4" />
                                <h3 className="font-passion text-2xl font-black uppercase text-tok-black">FREQUENCY INTERFERENCE</h3>
                                <p className="text-tok-black/60">We couldn't connect to the Signal Tower. Check your comms link.</p>
                            </div>
                        ) : feedbackItems?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 rounded-2xl border-[4px] border-dashed border-tok-black/10">
                                <Radio size={48} className="text-tok-black/10 mb-4" />
                                <p className="font-passion text-lg font-black uppercase tracking-[3px] text-tok-black/20">
                                    NO ACTIVE TRANSMISSIONS
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 animate-fade-up [animation-delay:200ms]">
                                {feedbackItems?.map((item) => (
                                    <FeedbackCard key={item.id} feedback={item} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showDialog && <FeedbackDialog onClose={() => setShowDialog(false)} />}
        </div>
    );
}
