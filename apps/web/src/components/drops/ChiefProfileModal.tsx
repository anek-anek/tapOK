'use client';

import React, { useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X as IconX, UserCheck as IconUserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChiefProfileModalProps {
  user: any;
  onClose: () => void;
}

export function ChiefProfileModal({ user, onClose }: ChiefProfileModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'JUNE 2024';
    try {
      const d = new Date(user.createdAt);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch { return 'JUNE 2024'; }
  }, [user?.createdAt]);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'NOT DISCLOSED';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    } catch { return 'NOT DISCLOSED'; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-tok-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-sm border-[4px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
      >
        {/* Tactical Header — Fixed */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b-[3px] border-tok-black bg-tok-teal px-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-white shadow-[2px_2px_0px_#1C1C1A]" />
            <p className="font-passion text-base font-bold uppercase tracking-[3px] text-white">
              Tactical Identifier
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
          >
            <IconX size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="flex flex-col items-center">
            {/* ID Photo */}
            <div className="group relative mb-6">
              <div className="relative h-40 w-40 overflow-hidden rounded-sm border-[4px] border-tok-black bg-tok-teal-pale shadow-[8px_8px_0px_#1C1C1A]">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-passion text-5xl text-tok-teal">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
              {/* Tactical Overlay */}
              <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full border-[3px] border-tok-black bg-amber-400 p-2 shadow-[3px_3px_0px_#1C1C1A]">
                <IconUserCheck size={20} className="text-tok-black" strokeWidth={3} />
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-passion text-4xl font-bold uppercase tracking-tight text-tok-black">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="mt-1 font-passion text-lg font-bold uppercase tracking-[3px] text-tok-teal">
                @{user?.userHandle || 'unregistered_chief'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {/* Intel Section */}
            <div className="rounded-sm border-2 border-tok-black bg-white p-5 shadow-[4px_4px_0px_#1C1C1A]">
              <p className="mb-4 font-passion text-[11px] font-bold uppercase tracking-[3px] text-tok-black/30">
                Mission Intel
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r-2 border-tok-black/10 pr-4">
                  <p className="font-passion text-3xl font-bold text-tok-teal">{user?.dropCount || 0}</p>
                  <p className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black/50">Drops</p>
                </div>
                <div className="pl-4">
                  <p className="font-passion text-3xl font-bold text-tok-black">{user?.crewReached || 0}</p>
                  <p className="font-passion text-[10px] font-bold uppercase tracking-[1.5px] text-tok-black/50">Crew Reached</p>
                </div>
              </div>
            </div>

            {/* Dossier Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between rounded-sm border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A]">
                <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">Active Since</span>
                <span className="font-passion text-sm font-bold text-tok-black">{memberSince}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A]">
                  <p className="font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-black/40">Gender</p>
                  <p className="mt-1 font-passion text-xs font-bold uppercase text-tok-black">{user?.gender || 'NOT SET'}</p>
                </div>
                <div className="rounded-sm border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A]">
                  <p className="font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-black/40">Birthday</p>
                  <p className="mt-1 font-passion text-xs font-bold uppercase text-tok-black">{formatDate(user?.birthday)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Footer — Fixed */}
        <div className="flex h-12 shrink-0 items-center justify-center border-t-[3px] border-tok-black bg-tok-black/5">
          <p className="font-passion text-[10px] font-bold uppercase tracking-[4px] text-tok-black/30">
            Mission Approved Credentials
          </p>
        </div>
      </motion.div>
    </div>
  );
}
