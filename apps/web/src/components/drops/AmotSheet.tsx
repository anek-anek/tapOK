'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmotDetail, useExpenseLogs } from '@/hooks/queries/use-drops';
import { useToggleMemberAmotOptOut, useToggleAmotPaid, useSubmitAmotProof, useConfirmAmotPayment, useRejectAmotProof } from '@/hooks/mutations/use-drop-mutations';
import { useAuth } from '@/components/providers/auth-provider';
import type { DropItem, Drop, CrewMember } from '@/types/drop';
import Image from 'next/image';
import { Loader2 as IconLoader, X as IconX, Plus as IconPlus, Check as IconCheck, Camera as IconCamera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'react-hot-toast';
import { AmotLogModal } from './AmotLogModal';

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

interface AmotSheetProps {
  dropId: string;
  item?: DropItem;
  drop?: Drop; // To show global summary
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrierName?: string;
  activeCrew?: CrewMember[];
}

export function AmotSheet({ dropId, item, drop, open, onOpenChange, carrierName, activeCrew }: AmotSheetProps) {
  const { dbUser } = useAuth();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    url: string;
    userId: string;
    expected: number;
    paidAmount: number;
    totalShare: number;
  } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const { data, isLoading } = useAmotDetail(dropId, item?.id || '', {
    enabled: !!open && !!item?.id
  });
  const { data: expenseLogs = [] } = useExpenseLogs(dropId, { enabled: !!open && !item });

  const toggleMemberOptOut = useToggleMemberAmotOptOut(dropId);
  const isOrganiser = dbUser?.id === drop?.organiserId;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  const amotItems = useMemo(() => {
    return drop?.neededItems?.filter((i: any) => i.amotCost != null) || [];
  }, [drop?.neededItems]);

  const totalMissionCost = useMemo(() => {
    const base = Number(drop?.baseCost || 0);
    const gearTotal = amotItems.reduce((acc, i) => acc + Number(i.amotCost || 0), 0);
    const approvedExpenses = expenseLogs
      .filter((l) => l.status === 'approved')
      .reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const subsidy = Number(drop?.chiefContribution || 0);
    return base + gearTotal + approvedExpenses - subsidy;
  }, [drop, amotItems, expenseLogs]);

  const crewCount = activeCrew?.length || 1;
  const flatRate = totalMissionCost / crewCount;

  const userExpenses = useMemo(() => {
    const expenses = new Map<string, number>();
    amotItems.forEach(i => {
      if (i.assignedUserId) {
        expenses.set(i.assignedUserId, (expenses.get(i.assignedUserId) || 0) + Number(i.amotCost || 0));
      }
    });
    return expenses;
  }, [amotItems]);

  const myTotalAmot = useMemo(() => {
    return flatRate;
  }, [flatRate]);

  const participants = useMemo(() => {
    if (!item || !data) return [];
    const participantsMap = new Map(data.participants.map(p => [p.userId, p]));
    const crewSource = activeCrew || drop?.crew || [];
    return crewSource.map((member: CrewMember) => {
      const p = participantsMap.get(member.userId);
      return {
        userId: member.userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        avatar: member.user.avatar,
        isOptedOut: p ? p.isOptedOut : false,
        isPaid: p ? p.isPaid : false,
        isCarrier: p ? p.isCarrier : member.userId === item.assignedUserId,
        amotPaidAt: member.amotPaidAt,
        amotProofPath: member.amotProofPath,
      };
    });
  }, [item, data, drop?.crew, activeCrew]);

  const amotRecapParticipants = useMemo(() => {
    if (item) return [];
    const crewSource = activeCrew || drop?.crew || [];

    return crewSource.map((member: CrewMember) => {
      const paid = Number(member.amotPaidAmount || 0);
      const expense = userExpenses.get(member.userId) || 0;
      const share = flatRate;
      const balance = share - paid - expense;

      return {
        userId: member.userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        avatar: member.user.avatar,
        amotPaidAt: member.amotPaidAt,
        amotPaidAmount: paid,
        amotProofPath: member.amotProofPath,
        totalShare: share,
        expense: expense,
        balance: balance,
      };
    });
  }, [item, drop?.crew, activeCrew, flatRate, userExpenses]);

  const handleToggleMember = async (userId: string, currentOptedOut: boolean) => {
    if (!item?.id) return;
    try {
      await toggleMemberOptOut.mutateAsync({
        itemId: item.id,
        userId,
        isOptedOut: !currentOptedOut,
      });
      toast.success(currentOptedOut ? 'CREW INCLUDED' : 'CREW RULED OUT');
    } catch {
      toast.error('FAILED TO UPDATE AMOT');
    }
  };

  const toggleAmotPaid = useToggleAmotPaid(dropId);
  const submitProof = useSubmitAmotProof(dropId);
  const confirmPayment = useConfirmAmotPayment(dropId);

  const isCarrier = dbUser?.id === item?.assignedUserId;
  const canManagePaid = isOrganiser || isCarrier;

  const myCrewRecord = useMemo(() => {
    const crewSource = activeCrew || drop?.crew || [];
    return crewSource.find(c => c.userId === dbUser?.id);
  }, [activeCrew, drop?.crew, dbUser?.id]);

  const isGloballyPaid = !!myCrewRecord?.amotPaidAt;
  const hasSubmittedProof = !!myCrewRecord?.amotProofPath;
  const myPaidAmount = Number(myCrewRecord?.amotPaidAmount || 0);

  const handleTogglePaid = async (userId: string, currentPaid: boolean) => {
    if (!item?.id) return;
    try {
      await toggleAmotPaid.mutateAsync({
        itemId: item.id,
        userId,
        isPaid: !currentPaid,
      });
      toast.success(!currentPaid ? 'MARKED AS PAID' : 'MARKED AS UNPAID');
    } catch {
      toast.error('FAILED TO UPDATE STATUS');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await submitProof.mutateAsync(base64);
        toast.success('PROOF SUBMITTED FOR CHIEF REVIEW');
      } catch (err) {
        toast.error('FAILED TO UPLOAD PROOF');
      }
    };
    reader.readAsDataURL(file);
  };

  const rejectProof = useRejectAmotProof(dropId);

  const handleConfirmGlobalPayment = async (userId: string, amount: number) => {
    try {
      await confirmPayment.mutateAsync({ userId, amount });
      toast.success('PAYMENT CONFIRMED');
      setSelectedProof(null);
      setConfirmAmount('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'FAILED TO CONFIRM';
      toast.error(msg);
    }
  };

  const handleRejectProof = async (userId: string) => {
    try {
      await rejectProof.mutateAsync(userId);
      toast.success('PROOF REJECTED');
      setSelectedProof(null);
    } catch {
      toast.error('FAILED TO REJECT PROOF');
    }
  };

  // Reset state on drop change to ensure drop-specificity
  useEffect(() => {
    setSelectedProof(null);
    setConfirmAmount('');
  }, [dropId]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-tok-black/60 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
            >
              <div className="relative border-b-[3px] border-tok-black px-6 py-5 shrink-0 bg-tok-cream">
                <div className="flex items-center justify-between gap-4 pr-10">
                  <div>
                    <p className="font-passion text-[12px] font-bold uppercase tracking-[2px] text-tok-black/40">
                      {item ? 'Amot-amot' : 'AMOT RECAP'}
                    </p>
                    <h2 className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-black leading-none">
                      {item ? item.name : 'DROP LEDGER'}
                    </h2>
                  </div>
                  {(data || !item) && (
                    <div className="text-right">
                      <p className="font-passion text-3xl font-bold uppercase tracking-tight text-tok-black leading-none">
                        ₱{(item ? Number(data?.amotCost || 0) : totalMissionCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/40">
                        {item ? 'ITEM COST' : 'TOTAL TRACKED'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-full p-2 hover:bg-tok-black/5 text-tok-black/20 hover:text-tok-black transition-colors"
                  >
                    <IconX size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-5 py-3 flex-1">
                {isLoading && item && (
                  <div className="flex justify-center py-8">
                    <IconLoader size={20} className="animate-spin text-tok-black/40" />
                  </div>
                )}

                {/* Drop Ledger (Global List) */}
                {!item && (
                  <div className="flex flex-col gap-4">
                    {/* Mission Ledger / Transparency List */}
                    <div className="mt-2 rounded-sm border-[3px] border-tok-black bg-white p-5 shadow-[6px_6px_0px_#1C1C1A]">
                      <div className="flex flex-col gap-4">
                        {amotRecapParticipants.map((p) => {
                          const isFullyPaid = !!p.amotPaidAt;
                          const isPartiallyPaid = p.amotPaidAmount > 0 && !isFullyPaid;

                          return (
                            <div key={p.userId} className="flex items-center justify-between border-b-2 border-tok-black/5 pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-tok-black">
                                  {p.avatar ? (
                                    <Image src={p.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-tok-teal text-[12px] font-bold text-white">
                                      {getInitials(p.firstName, p.lastName)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-passion text-base font-bold uppercase tracking-wide text-tok-black leading-tight">
                                    {p.firstName} {p.lastName}
                                    {p.userId === dbUser?.id && (
                                      <span className="ml-2 text-[10px] text-tok-teal bg-tok-teal/10 px-1.5 py-0.5 rounded-sm">YOU</span>
                                    )}
                                  </span>
                                  {!p.amotPaidAt && p.amotPaidAmount > 0 && (
                                    <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/40">
                                      Paid: ₱{p.amotPaidAmount.toLocaleString()} / {p.totalShare.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {isFullyPaid ? (
                                  <div className="flex items-center gap-1.5 rounded-[4px] border-2 border-emerald-500 bg-emerald-50 px-2.5 py-1 text-emerald-600 shadow-[2px_2px_0px_#10b981]">
                                    <span className="font-passion text-[11px] font-bold uppercase tracking-wider">Paid</span>
                                  </div>
                                ) : p.amotProofPath ? (
                                  <div className="flex items-center gap-2">
                                    {isOrganiser ? (
                                      <button
                                        onClick={() => setSelectedProof({
                                          url: p.amotProofPath!,
                                          userId: p.userId,
                                          expected: Math.max(0, p.totalShare - p.amotPaidAmount),
                                          paidAmount: p.amotPaidAmount,
                                          totalShare: p.totalShare
                                        })}
                                        className="flex h-8 items-center gap-2 rounded-sm border-2 border-tok-black bg-white px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none"
                                      >
                                        <IconCamera size={14} />
                                        Review
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-1.5 rounded-[4px] border-2 border-amber-400 bg-amber-50 px-2.5 py-1 text-amber-600">
                                        <span className="font-passion text-[11px] font-bold uppercase tracking-wider italic">Reviewing</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isPartiallyPaid ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 rounded-[4px] border-2 border-amber-400 bg-amber-50 px-2.5 py-1 text-amber-600 shadow-[2px_2px_0px_#fbbf24]">
                                      <span className="font-passion text-[11px] font-bold uppercase tracking-wider">Not Fully Paid</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 rounded-[4px] border-2 border-red-500 bg-red-50 px-2.5 py-1 text-red-600 shadow-[2px_2px_0px_#ef4444]">
                                      <span className="font-passion text-[11px] font-bold uppercase tracking-wider">Unpaid</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Your Amot Yellow Card */}
                    <div className="rounded-sm border-[3px] border-tok-black bg-amber-400 p-6 text-center shadow-[6px_6px_0px_#1C1C1A]">
                      <p className="font-passion text-[12px] font-bold uppercase tracking-[2px] text-tok-black/60">
                        {isGloballyPaid ? 'Total Share Settled' : 'Balance to Pay'}
                      </p>
                      <p className="my-1 font-passion text-5xl font-bold uppercase tracking-tight text-tok-black">
                        ₱{(isGloballyPaid ? 0 : Math.max(0, myTotalAmot - myPaidAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/40 px-4 leading-tight">
                        * Total mission cost split equally among all crew members.
                      </p>
                    </div>

                    {/* Payment Actions */}
                    <div className="mb-2">
                      {isGloballyPaid ? (
                        <div className="flex items-center justify-center gap-3 rounded-sm border-[3px] border-tok-black bg-emerald-500 py-4 text-white shadow-[6px_6px_0px_#1C1C1A]">
                          <IconCheck size={24} strokeWidth={3} />
                          <span className="font-passion text-xl font-bold uppercase tracking-wider">Amot Settled</span>
                        </div>
                      ) : hasSubmittedProof ? (
                        <div className="flex items-center justify-center gap-3 rounded-sm border-[3px] border-tok-black bg-amber-400 py-4 text-tok-black shadow-[6px_6px_0px_#1C1C1A]">
                          <span className="font-passion text-xl font-bold uppercase tracking-wider">Proof Pending Review</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="absolute inset-0 z-10 cursor-pointer opacity-0"
                            onChange={handleFileUpload}
                            disabled={submitProof.isPending}
                          />
                          <button
                            className="flex w-full items-center justify-center gap-3 rounded-sm border-[3px] border-tok-black bg-tok-teal py-4 font-passion text-xl font-bold uppercase tracking-widest text-white shadow-[6px_6px_0px_#1C1C1A] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#1C1C1A] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50"
                          >
                            {submitProof.isPending ? <IconLoader className="animate-spin" size={24} /> : <IconCamera size={24} />}
                            {myPaidAmount > 0
                              ? `Pay Balance (₱${Math.max(0, myTotalAmot - myPaidAmount).toLocaleString()})`
                              : 'Pay Now (Submit Proof)'
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Item Specific Participants */}
                {item && data && (
                  <div className="flex flex-col gap-0">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="flex items-center gap-2 rounded-sm border-[3px] border-tok-black bg-amber-400 px-4 py-2 shadow-[4px_4px_0px_#1C1C1A]">
                        <span className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
                          ₱{Number(data.perPersonShare).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="font-passion text-[12px] font-bold uppercase tracking-wider text-tok-black/60">
                          each
                        </span>
                      </div>
                      <span className="font-passion text-[13px] font-bold uppercase tracking-wider text-tok-black/40">
                        {data.participantCount} in · {data.participants.filter(p => p.isOptedOut).length} out
                      </span>
                    </div>

                    {participants.map((p) => (
                      <div
                        key={p.userId}
                        className="flex items-center gap-3 border-b-2 border-tok-black/5 py-3 last:border-b-0"
                      >
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-tok-black font-passion text-[10px] font-bold',
                          p.isOptedOut ? 'bg-tok-black/10 text-tok-black/40' : 'bg-tok-teal text-tok-cream',
                        )}>
                          {p.avatar ? (
                            <Image src={p.avatar} alt="" width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            getInitials(p.firstName, p.lastName)
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'font-passion text-base font-bold uppercase tracking-wider truncate',
                              p.isOptedOut ? 'text-tok-black/30 line-through' : 'text-tok-black',
                            )}>
                              {p.firstName} {p.lastName}
                            </span>
                            {(p.isPaid || p.amotPaidAt) && !p.isOptedOut && (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                Paid
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {p.isOptedOut ? (
                            <span className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/30">
                              Passed
                            </span>
                          ) : (
                            <span className={cn(
                              "font-passion text-xl font-bold uppercase tracking-tight",
                              (p.isPaid || p.amotPaidAt) ? "text-emerald-600" : "text-tok-black"
                            )}>
                              ₱{Number(data.perPersonShare).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-2">
                            {isOrganiser && (
                              <button
                                disabled={toggleMemberOptOut.isPending && (toggleMemberOptOut.variables as any)?.userId === p.userId}
                                onClick={() => handleToggleMember(p.userId, p.isOptedOut)}
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-sm border-2 border-tok-black transition-all active:scale-95 disabled:opacity-50",
                                  p.isOptedOut ? "bg-amber-400 text-tok-black" : "bg-red-500 text-white shadow-[1px_1px_0px_#1C1C1A]"
                                )}
                              >
                                {toggleMemberOptOut.isPending && (toggleMemberOptOut.variables as any)?.userId === p.userId ? (
                                  <IconLoader size={14} className="animate-spin" />
                                ) : p.isOptedOut ? (
                                  <IconPlus size={14} strokeWidth={3} />
                                ) : (
                                  <IconX size={14} strokeWidth={3} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="my-3 rounded-sm border-[3px] border-tok-black bg-tok-teal px-4 py-4 shadow-[6px_6px_0px_#1C1C1A]">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-passion text-[11px] font-bold uppercase tracking-[2px] text-tok-cream">
                            Who Bought
                          </span>
                          <span className="font-passion text-base font-bold uppercase tracking-wider text-tok-cream">
                            {carrierName}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-passion text-[11px] font-bold uppercase tracking-wider text-tok-cream">
                            Total Balik
                          </p>
                          <p className="font-passion text-2xl font-bold uppercase tracking-tight text-tok-cream">
                            ₱{Number(data.carrierOwed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AmotLogModal
        dropId={dropId}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />

      {/* Proof Viewer Modal */}
      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="absolute inset-0 bg-tok-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-full overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
            >
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none"
              >
                <IconX size={20} />
              </button>
              <div className="p-4">
                <p className="mb-4 font-passion text-[12px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  Payment Proof
                </p>
                <div className="relative aspect-[4/5] w-[320px] max-w-full overflow-hidden rounded-sm border-2 border-tok-black bg-white md:w-[400px]">
                  <Image
                    src={selectedProof.url}
                    alt="Proof"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                {isOrganiser && (
                  <div className="mt-6 flex flex-col gap-4 border-t-2 border-tok-black/5 pt-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/40">
                        <span>Verify Ledger Amount</span>
                        <span>₱{selectedProof.paidAmount.toLocaleString()} / {selectedProof.totalShare.toLocaleString()}</span>
                      </div>
                      <p className="mb-2 font-passion text-[11px] font-bold uppercase tracking-wider text-tok-black/60">
                        Remaining Balance: ₱{selectedProof.expected.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Confirm amount"
                          value={confirmAmount}
                          onChange={(e) => setConfirmAmount(e.target.value)}
                          className="h-12 flex-1 rounded-sm border-[3px] border-tok-black px-4 font-passion text-lg font-bold outline-none shadow-[4px_4px_0px_#1C1C1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleConfirmGlobalPayment(selectedProof.userId, Number(confirmAmount))}
                          disabled={confirmPayment.isPending}
                          className="h-12 rounded-sm border-[3px] border-tok-black bg-tok-teal px-6 font-passion text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                        >
                          {confirmPayment.isPending ? '...' : 'Confirm'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRejectProof(selectedProof.userId)}
                      disabled={rejectProof.isPending}
                      className="h-10 w-full rounded-sm border-2 border-tok-black bg-white font-passion text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 active:translate-y-0.5 disabled:opacity-50"
                    >
                      Reject Proof (Ask to Resubmit)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
