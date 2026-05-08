'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Calendar, MapPin, Shield, Info, Mail, Hash, Clock, CheckCircle, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import type { User } from '@/types/user';
import type { Drop } from '@/types/drop';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalProps extends BaseModalProps {
  children: React.ReactNode;
}

import { useEffect } from 'react';

import { Portal } from '../shared/Portal';

function ModalBase({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-tok-black/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
            >
              {children}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm border-2 border-tok-black bg-white p-1 text-tok-black transition-all hover:scale-110 active:scale-95"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

interface UserSummaryProps extends BaseModalProps {
  user: User | null;
}

export function AdminUserSummaryModal({ isOpen, onClose, user }: UserSummaryProps) {
  if (!user) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b-2 border-tok-black/10 pb-8">
          <div className="h-24 w-24 shrink-0 rounded-full border-[3px] border-tok-black bg-white shadow-[4px_4px_0px_#1C1C1A] overflow-hidden relative">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.firstName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-tok-teal/10">
                <UserIcon className="text-tok-teal" size={40} />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h2 className="font-passion text-3xl font-black uppercase tracking-tight text-tok-black truncate">
              {user.firstName} {user.lastName}
            </h2>
            <p className="font-passion text-sm font-bold uppercase tracking-[2px] text-tok-teal">
              @{user.userHandle || 'no_handle'}
            </p>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="rounded-full border-2 border-tok-black bg-tok-black px-3 py-0.5 font-passion text-[10px] font-bold uppercase tracking-widest text-tok-cream">
                {user.role}
              </span>
              {user.isEmailVerified && (
                <span className="flex items-center gap-1 rounded-full border-2 border-tok-black bg-tok-teal px-3 py-0.5 font-passion text-[10px] font-bold uppercase tracking-widest text-tok-cream">
                  <CheckCircle size={10} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DetailItem icon={<Mail size={16} />} label="Email" value={user.email} />
          <DetailItem icon={<Shield size={16} />} label="Auth Provider" value={user.authProvider} />
          <DetailItem icon={<Info size={16} />} label="Gender" value={user.gender || 'Not specified'} />
          <DetailItem icon={<Calendar size={16} />} label="Birthday" value={user.birthday ? format(new Date(user.birthday), 'MMMM d, yyyy') : 'Not specified'} />
          <DetailItem icon={<Clock size={16} />} label="Joined" value={format(new Date(user.createdAt), 'MMMM d, yyyy')} />
          <DetailItem icon={<Hash size={16} />} label="User ID" value={user.id} />
        </div>
      </div>
    </ModalBase>
  );
}

interface DropSummaryProps extends BaseModalProps {
  drop: Drop | null;
}

export function AdminDropSummaryModal({ isOpen, onClose, drop }: DropSummaryProps) {
  if (!drop) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="relative h-48 w-full border-b-[3px] border-tok-black bg-tok-black/5">
        {drop.coverPhoto ? (
          <Image src={drop.coverPhoto} alt={drop.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-tok-black/10">
            <Calendar className="text-tok-black/20" size={60} />
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <span className={cn(
            "rounded-sm border-2 border-tok-black px-3 py-1 font-passion text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_#1C1C1A]",
            drop.status === 'active' ? "bg-tok-teal text-tok-cream" :
              drop.status === 'ongoing' ? "bg-tok-teal text-tok-cream animate-pulse" :
                "bg-tok-black/20 text-tok-black"
          )}>
            {drop.status}
          </span>
        </div>
      </div>

      <div className="p-8">
        <h2 className="font-passion text-4xl font-black uppercase leading-tight tracking-tight text-tok-black mb-6">
          {drop.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DetailItem icon={<Calendar size={16} />} label="Scheduled At" value={format(new Date(drop.scheduledAt), 'MMMM d, yyyy @ h:mm a')} />
          <DetailItem icon={<MapPin size={16} />} label="Location" value={drop.location} />
          <DetailItem icon={<UserIcon size={16} />} label="Organiser (Chief)" value={`${drop.organiser?.firstName} ${drop.organiser?.lastName}`} />
          <DetailItem icon={<Info size={16} />} label="Category" value={drop.category || 'Not specified'} />
          <DetailItem icon={<Smartphone size={16} />} label="Join Code" value={drop.joinCode} />
          <DetailItem icon={<Shield size={16} />} label="Privacy" value={drop.isPublic ? 'Public' : 'Private'} />
          <DetailItem icon={<Info size={16} />} label="Min Age" value={drop.minimumAge ? `${drop.minimumAge}+` : 'None'} />
          <DetailItem icon={<UserIcon size={16} />} label="Expected Headcount" value={drop.expectedHeadcount ? drop.expectedHeadcount.toString() : 'None'} />
        </div>

        {drop.overview && (
          <div className="mt-8 border-t-2 border-tok-black/10 pt-6">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30 mb-2">Overview</p>
            <p className="font-inter text-sm leading-relaxed text-tok-black/70 italic">
              "{drop.overview}"
            </p>
          </div>
        )}
      </div>
    </ModalBase>
  );
}

import { Feedback, FeedbackStatus, useUpdateFeedbackStatus } from '@/hooks/queries/use-feedback';
import { Radio, Zap, ShieldOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedbackSummaryProps extends BaseModalProps {
  feedback: Feedback | null;
}

export function AdminFeedbackSummaryModal({ isOpen, onClose, feedback }: FeedbackSummaryProps) {
  const updateStatus = useUpdateFeedbackStatus();

  if (!feedback) return null;

  const handleStatusChange = (status: FeedbackStatus) => {
    updateStatus.mutate({ id: feedback.id, status }, {
      onSuccess: () => {
        toast.success(`Status updated to ${status.toUpperCase()}`);
      },
      onError: () => {
        toast.error('Failed to update status');
      }
    });
  };

  const STATUSES: FeedbackStatus[] = ['pending', 'investigating', 'resolved', 'rejected'];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-sm border-[3px] border-tok-black shadow-[3px_3px_0px_#1C1C1A]",
            feedback.type === 'bug' ? "bg-red-100 text-red-600" : "bg-tok-teal/10 text-tok-teal"
          )}>
            {feedback.type === 'bug' ? <ShieldOff size={20} /> : <Zap size={20} />}
          </div>
          <div className="min-w-0">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              {feedback.type === 'bug' ? 'MALFUNCTION' : 'UPGRADE'}
            </p>
            <h2 className="font-passion text-3xl font-black uppercase tracking-tight text-tok-black truncate">
              {feedback.title}
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border-[3px] border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A]">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30 mb-2">Detailed Broadcast</p>
            <p className="text-sm leading-relaxed text-tok-black/70">
              {feedback.description}
            </p>
          </div>

          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailItem icon={<UserIcon size={16} />} label="Transmitted By" value={`${feedback.creator.firstName} ${feedback.creator.lastName}`} />
            <DetailItem icon={<Clock size={16} />} label="Signal Date" value={format(new Date(feedback.createdAt), 'MMMM d, yyyy @ h:mm a')} />
            <DetailItem icon={<Radio size={16} />} label="Signal Strength" value={feedback.score.toString()} />
            <DetailItem icon={<Info size={16} />} label="Current Status" value={feedback.status.toUpperCase()} />
          </div>

          <div className="border-t-2 border-tok-black/10 pt-6">
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/30 mb-4">Update Signal Status</p>
            <div className="flex flex-wrap gap-3">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updateStatus.isPending}
                  className={cn(
                    "flex h-10 items-center justify-center px-4 rounded-sm border-[3px] border-tok-black font-passion text-[11px] font-black uppercase tracking-[2px] transition-all",
                    feedback.status === status
                      ? "bg-tok-black text-tok-cream shadow-none translate-x-0.5 translate-y-0.5"
                      : "bg-white text-tok-black hover:-translate-y-0.5 shadow-[3px_3px_0px_#1C1C1A] hover:shadow-[5px_5px_0px_#1C1C1A]"
                  )}
                >
                  {updateStatus.isPending && updateStatus.variables?.status === status ? <Loader2 size={12} className="animate-spin mr-2" /> : null}
                  {status === 'investigating' ? 'Scanning' : status === 'rejected' ? 'Discarded' : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="mt-1 text-tok-teal">{icon}</div>
      <div className="min-w-0">
        <p className="font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-black/30">{label}</p>
        <p className="font-inter text-sm font-bold text-tok-black truncate">{value}</p>
      </div>
    </div>
  );
}
