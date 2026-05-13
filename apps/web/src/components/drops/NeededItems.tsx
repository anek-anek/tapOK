'use client';

import {
  Check as IconCheck,
  Users as IconUsersGroup,
  Hand as IconHandClick,
  X as IconX,
  PhilippinePeso as IconPeso,
  Receipt as IconReceipt,
  PiggyBank as IconPiggyBank,
  Settings2 as IconSettings,
  Dice5 as IconDice,
  History as IconHistory,
  Plus as IconPlus,
  Loader2 as IconLoader,
  Trash2 as IconTrash,
  Pencil as IconPencil,
  Package as IconPackage,
  ChevronRight as IconChevron,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  useAddItem,
  useRenameItem,
  useRemoveItem,
  useAssignItem,
  useUnassignItem,
  useRandomAssignItems,
  usePickItem,
  useConfirmItem,
  useDeclareAmot,
  useClearAmot,
  useToggleAmotOptOut,
  useApproveExpenseLog,
  useRejectExpenseLog,
  useDeleteExpenseLog,
  useSubmitExpenseLog,
} from '@/hooks/mutations/use-drop-mutations';
import { useExpenseLogs } from '@/hooks/queries/use-drops';
import type { Drop, CrewMember, DropItem, DropExpenseLog } from '@/types/drop';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from '@/components/ui/popover';
import { AmotSheet } from './AmotSheet';
import { AmotLogModal } from './AmotLogModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface NeededItemsProps {
  drop: Drop;
  isOrganiser: boolean;
  isCrewMember: boolean;
  currentUser?: { id: string; firstName: string; lastName: string; avatar?: string };
  activeCrew: CrewMember[];
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

type UnifiedEntry =
  | { kind: 'gear'; item: DropItem }
  | { kind: 'expense'; log: DropExpenseLog };

export function NeededItems({
  drop,
  isOrganiser,
  isCrewMember,
  currentUser,
  activeCrew,
}: NeededItemsProps) {
  const [costInput, setCostInput] = useState('');
  const [isAmotSheetOpen, setIsAmotSheetOpen] = useState(false);
  const [isAmotLogOpen, setIsAmotLogOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedAmotItem, setSelectedAmotItem] = useState<DropItem | undefined>();
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [confirmingAction, setConfirmingAction] = useState<{
    type: 'pick' | 'unassign' | 'confirm' | 'random' | 'declare' | 'pass-amot' | 'remove-gear' | 'delete-expense';
    itemId?: string;
    item?: any;
    member?: CrewMember;
  } | null>(null);

  const renameItem = useRenameItem(drop.id);
  const removeItem = useRemoveItem(drop.id);
  const assignItem = useAssignItem(drop.id);
  const unassignItem = useUnassignItem(drop.id);
  const randomAssign = useRandomAssignItems(drop.id);
  const pickItem = usePickItem(drop.id);
  const confirmItem = useConfirmItem(drop.id);
  const declareAmot = useDeclareAmot(drop.id);
  const clearAmot = useClearAmot(drop.id);

  const approveLog = useApproveExpenseLog(drop.id);
  const rejectLog = useRejectExpenseLog(drop.id);
  const deleteLog = useDeleteExpenseLog(drop.id);

  const { data: expenseLogs = [] } = useExpenseLogs(drop.id);

  const handleDeclareAmot = async (itemId: string, amount: number) => {
    try {
      await declareAmot.mutateAsync({ itemId, cost: amount });
      toast.success('COST DECLARED');
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO DECLARE COST');
    }
  };

  const handleUnassignItem = async (itemId: string) => {
    try {
      await unassignItem.mutateAsync(itemId);
      toast.success('GEAR UNASSIGNED');
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO UNASSIGN GEAR');
    }
  };

  const handlePassOnAmot = async (itemId: string) => {
    try {
      await clearAmot.mutateAsync(itemId);
      toast.success('AMOT REMOVED');
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO REMOVE AMOT');
    }
  };

  const handleAssignItem = async (itemId: string, member: CrewMember) => {
    if (assignItem.isPending) return;
    try {
      await assignItem.mutateAsync({
        itemId,
        assignedUserId: member.userId,
        assignedUser: { ...member.user },
      });
      toast.success('GEAR ASSIGNED');
      setConfirmingAction(null);
    } catch (err: any) {
      const isConflict = err?.response?.status === 409 || err?.status === 409;
      toast.error(isConflict ? 'GEAR ALREADY TAKEN' : 'FAILED TO ASSIGN GEAR');
      setConfirmingAction(null);
    }
  };

  const handleRandomAssign = async () => {
    try {
      await randomAssign.mutateAsync();
      toast.success('GEAR DISTRIBUTED');
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO DISTRIBUTE GEAR');
    }
  };

  const handlePickItem = async (itemId: string) => {
    if (!currentUser || pickItem.isPending) return;
    try {
      await pickItem.mutateAsync({ itemId, user: currentUser });
      toast.success('GEARED UP!');
      setConfirmingAction(null);
    } catch (err: any) {
      const isConflict = err?.response?.status === 409 || err?.status === 409;
      toast.error(isConflict ? 'GEAR ALREADY TAKEN' : 'FAILED TO BRING GEAR');
      setConfirmingAction(null);
    }
  };

  const handleConfirmItem = async (itemId: string) => {
    try {
      await confirmItem.mutateAsync(itemId);
      toast.success('GEAR CONFIRMED ON-SITE');
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO CONFIRM GEAR');
    }
  };

  const handleApproveLog = async (logId: string) => {
    try {
      await approveLog.mutateAsync(logId);
      toast.success('EXPENSE APPROVED');
    } catch {
      toast.error('FAILED TO APPROVE');
    }
  };

  const handleRejectLog = async (logId: string) => {
    try {
      await rejectLog.mutateAsync(logId);
      toast.success('EXPENSE REJECTED');
    } catch {
      toast.error('FAILED TO REJECT');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLog.mutateAsync(logId);
      toast.success('EXPENSE REMOVED');
    } catch {
      toast.error('FAILED TO REMOVE');
    }
  };

  const handleRenameGear = async (itemId: string) => {
    const name = renameInput.trim();
    if (!name) return;
    try {
      await renameItem.mutateAsync({ itemId, name });
      setRenamingItemId(null);
    } catch {
      toast.error('FAILED TO RENAME GEAR');
    }
  };

  const handleRemoveGear = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
      setConfirmingAction(null);
    } catch {
      toast.error('FAILED TO REMOVE GEAR');
    }
  };

  const unassignedCount = drop?.neededItems?.filter((i) => !i.assignedUserId && i.isAssignable).length || 0;
  const hasAssignables = unassignedCount > 0;
  const pendingExpenses = expenseLogs.filter((l) => l.status === 'pending').length;

  // Approved expense logs with a linkedItemId are already represented as DropItems — exclude them
  const entries: UnifiedEntry[] = [
    ...(drop?.neededItems || []).map((item): UnifiedEntry => ({ kind: 'gear', item })),
    ...expenseLogs
      .filter((log) => !(log.status === 'approved' && log.linkedItemId))
      .map((log): UnifiedEntry => ({ kind: 'expense', log })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex w-full items-center justify-end gap-2">
        <button
          onClick={() => setIsAmotSheetOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-tok-teal px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          <IconReceipt size={12} />
          <span>Amot-amot</span>
        </button>

        <button
          onClick={() => setIsAmotLogOpen(true)}
          title="Amot History"
          className="flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-white px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none"
        >
          <IconHistory size={12} />
          <span className="max-sm:hidden">History</span>
        </button>
      </div>

      {/* Unified list */}
      <div className="flex flex-col gap-0 rounded-sm border-2 border-tok-black shadow-[4px_4px_0px_#1C1C1A] [&>*:first-child]:rounded-t-[2px] [&>*:last-child]:rounded-b-[2px]">

        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1;

          if (entry.kind === 'gear') {
            const item = entry.item;
            const isAssigned = !!item.assignedUserId;
            const isAssignedToMe = item.assignedUserId === currentUser?.id;
            const hasAmot = item.amotCost != null;

            const railColor = item.isConfirmed
              ? 'bg-emerald-500'
              : item.assignedUserId
              ? 'bg-tok-teal'
              : 'bg-amber-400';

            return (
              <div
                key={`gear-${item.id}`}
                className={cn(
                  'flex items-stretch bg-white transition-colors',
                  !isLast && 'border-b-2 border-tok-black/10',
                )}
              >
                {/* Type rail */}
                <div className={cn('w-1.5 shrink-0', railColor)} />

                {/* Content */}
                <div className="flex flex-1 min-w-0 flex-row items-center">
                  <div className="flex flex-1 min-w-0 px-3 py-3 flex-col justify-center">
                    <div className="flex items-center gap-2 min-w-0">
                      {renamingItemId === item.id ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleRenameGear(item.id); }}
                          className="flex flex-1 min-w-0 items-center gap-1.5"
                        >
                          <input
                            autoFocus
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setRenamingItemId(null)}
                            className="flex-1 min-w-0 rounded-sm border-2 border-tok-teal bg-white px-2 py-0.5 font-passion text-sm font-bold uppercase tracking-wide text-tok-black outline-none"
                          />
                          <button type="submit" disabled={renameItem.isPending} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-tok-teal text-white disabled:opacity-50">
                            <IconCheck size={11} strokeWidth={3} />
                          </button>
                          <button type="button" onClick={() => setRenamingItemId(null)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-tok-black/10 text-tok-black">
                            <IconX size={11} strokeWidth={3} />
                          </button>
                        </form>
                      ) : (
                        <p className={cn(
                          'font-passion text-base font-bold uppercase tracking-wide text-tok-black truncate',
                          item.isConfirmed && 'text-tok-black/50 line-through',
                        )}>
                          {item.name}
                        </p>
                      )}
                      {item.amotCost != null && (
                        <button
                          onClick={isAssignedToMe && !item.isConfirmed ? () => setConfirmingAction({ type: 'declare', itemId: item.id, item }) : undefined}
                          disabled={item.isConfirmed}
                          className={cn(
                            'shrink-0 flex items-center justify-center rounded-sm border border-tok-black bg-amber-400 px-2 h-5 shadow-[1px_1px_0px_#1C1C1A] transition-all',
                            isAssignedToMe && !item.isConfirmed && 'hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#1C1C1A] active:translate-y-0 active:shadow-none',
                          )}
                        >
                          <span className="font-passion text-[11px] font-bold text-tok-black leading-none pt-[1px]">
                            ₱{item.amotCost.toLocaleString()}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      {item.assignedUser ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 overflow-hidden rounded-full border border-tok-black">
                            {item.assignedUser.avatar ? (
                              <Image src={item.assignedUser.avatar} alt="" width={16} height={16} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-tok-cream font-passion text-[6px] font-bold text-tok-black">
                                {getInitials(item.assignedUser.firstName, item.assignedUser.lastName)}
                              </div>
                            )}
                          </div>
                          <span className="font-passion text-[10px] font-bold uppercase tracking-tight text-tok-black/60 leading-none">
                            {isAssignedToMe ? 'You' : item.assignedUser.firstName}
                          </span>
                          {item.isConfirmed && (
                            <span className="font-passion text-[8px] font-bold uppercase text-emerald-500 leading-none">· Arrived</span>
                          )}
                        </div>
                      ) : (
                        <span className="font-passion text-[9px] font-bold uppercase tracking-widest text-amber-500/60">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-3 shrink-0">
                    {isCrewMember && item.isAssignable && !isAssigned && !isOrganiser && (
                      <button
                        onClick={() => setConfirmingAction({ type: 'pick', itemId: item.id })}
                        className="flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-tok-teal px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-cream shadow-[2px_2px_0px_#1C1C1A] active:shadow-none active:translate-y-0.5"
                      >
                        <IconHandClick size={12} strokeWidth={2.5} />
                        <span>Bring</span>
                      </button>
                    )}

                    {isOrganiser && !item.isConfirmed && !isAssigned && (
                      <Popover>
                        <PopoverTrigger className="hidden sm:flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-white px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[2px_2px_0px_#1C1C1A] active:shadow-none active:translate-y-0.5">
                          <IconUsersGroup size={12} />
                          <span>Assign</span>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[220px] p-0 rounded-sm border-2 border-tok-black shadow-[4px_4px_0px_#1C1C1A]">
                          <div className="bg-tok-black px-3 py-2">
                            <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-cream">Assign Mission</span>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto p-1 bg-white">
                            {activeCrew.map((member) => (
                              <button
                                key={member.userId}
                                disabled={assignItem.isPending}
                                onClick={() => handleAssignItem(item.id, member)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-tok-black/5',
                                  item.assignedUserId === member.userId && 'bg-tok-teal/10',
                                  assignItem.isPending && 'opacity-50 cursor-not-allowed',
                                )}
                              >
                                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-tok-black bg-tok-cream">
                                  {member.user.avatar ? (
                                    <Image src={member.user.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center font-passion text-[10px] font-bold text-tok-black">
                                      {getInitials(member.user.firstName, member.user.lastName)}
                                    </div>
                                  )}
                                </div>
                                <span className="flex-1 font-passion text-xs font-bold uppercase tracking-tight text-tok-black truncate">
                                  {member.user.firstName}
                                </span>
                                {item.assignedUserId === member.userId && <IconCheck size={12} className="text-tok-teal" strokeWidth={3} />}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {isOrganiser && isAssigned && !item.isConfirmed && (
                      <button
                        onClick={() => setConfirmingAction({ type: 'confirm', itemId: item.id })}
                        className="flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-emerald-500 px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-white shadow-[2px_2px_0px_#1C1C1A] active:shadow-none active:translate-y-0.5"
                      >
                        <IconCheck size={12} strokeWidth={3} />
                        <span>Arrived</span>
                      </button>
                    )}

                    {(isAssignedToMe || isOrganiser) && (
                      <Popover>
                        <PopoverTrigger className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[2px_2px_0px_#1C1C1A] active:shadow-none active:translate-y-0.5">
                          <IconSettings size={15} />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[170px] p-0 rounded-sm border-2 border-tok-black shadow-[4px_4px_0px_#1C1C1A]">
                          <div className="bg-tok-black px-3 py-1.5">
                            <span className="font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-cream">Controls</span>
                          </div>
                          <div className="flex flex-col p-1 bg-white">
                            {isOrganiser && !item.isConfirmed && !isAssigned && (
                              <>
                                <Popover>
                                  <PopoverTrigger className="sm:hidden flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-tok-black/5">
                                    <IconUsersGroup size={13} className="text-tok-black/50" />
                                    <span className="font-passion text-xs font-bold uppercase tracking-tight text-tok-black">Assign</span>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-[220px] p-0 rounded-sm border-2 border-tok-black shadow-[4px_4px_0px_#1C1C1A]">
                                    <div className="bg-tok-black px-3 py-2">
                                      <span className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-cream">Assign Mission</span>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto p-1 bg-white">
                                      {activeCrew.map((member) => (
                                        <button
                                          key={member.userId}
                                          disabled={assignItem.isPending}
                                          onClick={() => handleAssignItem(item.id, member)}
                                          className={cn(
                                            'flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-tok-black/5',
                                            item.assignedUserId === member.userId && 'bg-tok-teal/10',
                                            assignItem.isPending && 'opacity-50 cursor-not-allowed',
                                          )}
                                        >
                                          <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-tok-black bg-tok-cream">
                                            {member.user.avatar ? (
                                              <Image src={member.user.avatar} alt="" width={24} height={24} className="h-full w-full object-cover" />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center font-passion text-[10px] font-bold text-tok-black">
                                                {getInitials(member.user.firstName, member.user.lastName)}
                                              </div>
                                            )}
                                          </div>
                                          <span className="flex-1 font-passion text-xs font-bold uppercase tracking-tight text-tok-black truncate">
                                            {member.user.firstName}
                                          </span>
                                          {item.assignedUserId === member.userId && <IconCheck size={12} className="text-tok-teal" strokeWidth={3} />}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <div className="my-1 border-t border-tok-black/10 sm:hidden" />
                              </>
                            )}
                            <PopoverClose
                              onClick={() => setConfirmingAction({ type: 'declare', itemId: item.id, item })}
                              className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-amber-50"
                            >
                              <IconPiggyBank size={13} className="text-amber-500" />
                              <span className="font-passion text-xs font-bold uppercase tracking-tight text-tok-black">
                                {hasAmot ? 'Update Cost' : 'Declare Cost'}
                              </span>
                            </PopoverClose>

                            {isOrganiser && hasAmot && (
                              <PopoverClose
                                onClick={() => { setSelectedAmotItem(item); setIsAmotSheetOpen(true); }}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-tok-teal/5"
                              >
                                <IconReceipt size={13} className="text-tok-teal" />
                                <span className="font-passion text-xs font-bold uppercase tracking-tight text-tok-black">
                                  Manage Split
                                </span>
                              </PopoverClose>
                            )}

                            {hasAmot && (
                              <PopoverClose
                                onClick={() => setConfirmingAction({ type: 'pass-amot', itemId: item.id })}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-red-50 text-red-500"
                              >
                                <IconX size={13} strokeWidth={3} />
                                <span className="font-passion text-xs font-bold uppercase tracking-tight">Pass on Amot</span>
                              </PopoverClose>
                            )}

                            {isAssigned && !item.isConfirmed && (isAssignedToMe || isOrganiser) && (
                              <PopoverClose
                                onClick={() => setConfirmingAction({ type: 'unassign', itemId: item.id })}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-red-50 text-red-500"
                              >
                                <IconX size={13} strokeWidth={3} />
                                <span className="font-passion text-xs font-bold uppercase tracking-tight">
                                  {isAssignedToMe ? 'Release Gear' : 'Unassign Gear'}
                                </span>
                              </PopoverClose>
                            )}

                            {isOrganiser && (
                              <>
                                <div className="my-1 border-t border-tok-black/10" />
                                <PopoverClose
                                  onClick={() => { setRenamingItemId(item.id); setRenameInput(item.name); }}
                                  className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-tok-black/5"
                                >
                                  <IconPencil size={13} className="text-tok-black/50" />
                                  <span className="font-passion text-xs font-bold uppercase tracking-tight text-tok-black">Rename</span>
                                </PopoverClose>
                                <PopoverClose
                                  onClick={() => setConfirmingAction({ type: 'remove-gear', itemId: item.id })}
                                  className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-red-50 text-red-500"
                                >
                                  <IconTrash size={13} />
                                  <span className="font-passion text-xs font-bold uppercase tracking-tight">Remove</span>
                                </PopoverClose>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Expense log entry
          const log = entry.log;
          const isSubmitter = log.submittedById === currentUser?.id;
          const user = log.submittedBy;

          const expenseRailColor =
            log.status === 'approved'
              ? 'bg-emerald-500'
              : log.status === 'rejected'
              ? 'bg-red-400'
              : 'bg-amber-400';

          return (
            <div
              key={`expense-${log.id}`}
              className={cn(
                'flex items-stretch bg-white transition-colors',
                !isLast && 'border-b-2 border-tok-black/10',
                log.status === 'rejected' && 'opacity-50',
              )}
            >
              {/* Type rail */}
              <div className={cn('w-1.5 shrink-0', expenseRailColor)} />

              {/* Content */}
              <div className="flex flex-1 min-w-0 flex-row items-center">
                <div className="flex flex-1 min-w-0 px-3 py-3 flex-col justify-center">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="font-passion text-base font-bold uppercase tracking-wide text-tok-black truncate">
                      {log.description}
                    </p>
                    <span className="shrink-0 flex items-center justify-center rounded-sm border border-tok-black bg-amber-400 px-2 h-5 shadow-[1px_1px_0px_#1C1C1A]">
                      <span className="font-passion text-[11px] font-bold text-tok-black leading-none pt-[1px]">
                        ₱{Number(log.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    {user && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 overflow-hidden rounded-full border border-tok-black">
                          {user.avatar ? (
                            <Image src={user.avatar} alt="" width={16} height={16} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-tok-cream font-passion text-[6px] font-bold text-tok-black">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                          )}
                        </div>
                        <span className="font-passion text-[10px] font-bold uppercase tracking-tight text-tok-black/60 leading-none">
                          {isSubmitter ? 'You' : user.firstName}
                        </span>
                      </div>
                    )}
                    {log.status === 'pending' && (
                      <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-amber-600">· Pending approval</span>
                    )}
                    {log.status === 'rejected' && (
                      <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-red-500">· Rejected</span>
                    )}
                  </div>
                </div>

                {/* Actions — only show when there's something to act on */}
                {(isOrganiser || isSubmitter) && log.status !== 'approved' && (
                  <div className="flex items-center px-3 shrink-0">
                    <Popover>
                      <PopoverTrigger className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-white shadow-[2px_2px_0px_#1C1C1A] active:shadow-none active:translate-y-0.5">
                        <IconSettings size={15} />
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[170px] p-0 rounded-sm border-2 border-tok-black shadow-[4px_4px_0px_#1C1C1A]">
                        <div className="bg-tok-black px-3 py-1.5">
                          <span className="font-passion text-[9px] font-bold uppercase tracking-[2px] text-tok-cream">Controls</span>
                        </div>
                        <div className="flex flex-col p-1 bg-white">
                          {log.status === 'pending' && isOrganiser && (
                            <>
                              <PopoverClose
                                onClick={() => handleApproveLog(log.id)}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-emerald-50"
                              >
                                <IconCheck size={13} className="text-emerald-500" strokeWidth={3} />
                                <span className="font-passion text-xs font-bold uppercase tracking-tight text-tok-black">Approve</span>
                              </PopoverClose>
                              <PopoverClose
                                onClick={() => handleRejectLog(log.id)}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-red-50 text-red-500"
                              >
                                <IconX size={13} strokeWidth={3} />
                                <span className="font-passion text-xs font-bold uppercase tracking-tight">Reject</span>
                              </PopoverClose>
                              <div className="my-1 border-t border-tok-black/10" />
                            </>
                          )}
                          <PopoverClose
                            onClick={() => setConfirmingAction({ type: 'delete-expense', itemId: log.id })}
                            className="flex w-full items-center gap-2 rounded-sm p-2 text-left transition-colors hover:bg-red-50 text-red-500"
                          >
                            <IconTrash size={13} />
                            <span className="font-passion text-xs font-bold uppercase tracking-tight">Delete</span>
                          </PopoverClose>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Unified add row */}
        <button
          onClick={() => setIsAddItemOpen(true)}
          className={cn("group flex w-full items-center justify-center gap-2 bg-white px-4 py-2.5 transition-colors hover:bg-tok-black/[0.02]", entries.length > 0 && "border-t-2 border-dashed border-tok-black/20 hover:border-tok-black/40")}
        >
          <IconPlus size={11} strokeWidth={3} className="text-tok-black/30 transition-colors group-hover:text-tok-black/60" />
          <span className="font-passion text-[10px] font-bold uppercase tracking-widest text-tok-black/30 transition-colors group-hover:text-tok-black/60">
            Add Item
          </span>
        </button>

        {/* Distribute — organiser-only add row */}
        {isOrganiser && hasAssignables && (
          <button
            onClick={() => setConfirmingAction({ type: 'random' })}
            disabled={randomAssign.isPending}
            className="group flex w-full items-center justify-center gap-2 border-t-2 border-dashed border-amber-400/60 bg-amber-50/40 px-4 py-2.5 transition-colors hover:bg-amber-50 disabled:opacity-50"
          >
            <div className="transition-transform group-hover:rotate-12">
              <IconDice size={11} className="text-amber-500/60 group-hover:text-amber-600" />
            </div>
            <span className="font-passion text-[10px] font-bold uppercase tracking-widest text-amber-500/60 transition-colors group-hover:text-amber-600">
              Distribute {unassignedCount} unassigned
            </span>
          </button>
        )}
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmingAction?.type === 'pick'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handlePickItem(confirmingAction.itemId)}
        title="BRING THIS GEAR?"
        description="You're committing to bringing this item to the drop. Are you ready?"
        confirmText="LETS GO"
        isDestructive={false}
        variant="success"
        isLoading={pickItem.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'unassign'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handleUnassignItem(confirmingAction.itemId)}
        title="RELEASE GEAR?"
        description="This gear will go back to the needed list for someone else to bring. Proceed?"
        confirmText="RELEASE"
        isDestructive={true}
        isLoading={unassignItem.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'confirm'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handleConfirmItem(confirmingAction.itemId)}
        title="GEAR ARRIVED?"
        description="This marks the item as confirmed and on-site. Ready to lock it in?"
        confirmText="CONFIRM"
        isDestructive={false}
        variant="success"
        isLoading={confirmItem.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'random'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => handleRandomAssign()}
        title="DISTRIBUTE REMAINING GEAR?"
        description="This will randomly assign all remaining needed gear to active crew members. Continue?"
        confirmText="DISTRIBUTE"
        isDestructive={false}
        variant="info"
        isLoading={randomAssign.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'pass-amot'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handlePassOnAmot(confirmingAction.itemId)}
        title="STOP AMOT?"
        description="This will remove all shared costs for this gear. Are you sure?"
        confirmText="STOP AMOT"
        isDestructive={true}
        isLoading={clearAmot.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'remove-gear'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handleRemoveGear(confirmingAction.itemId)}
        title="REMOVE GEAR?"
        description="This will permanently remove this gear item from the drop."
        confirmText="REMOVE"
        isDestructive={true}
        isLoading={removeItem.isPending}
      />

      <ConfirmModal
        isOpen={confirmingAction?.type === 'delete-expense'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => confirmingAction?.itemId && handleDeleteLog(confirmingAction.itemId)}
        title="DELETE EXPENSE?"
        description="This will permanently remove this expense from the drop."
        confirmText="DELETE"
        isDestructive={true}
        isLoading={deleteLog.isPending}
      />

      <DeclareCostModal
        isOpen={confirmingAction?.type === 'declare'}
        onClose={() => setConfirmingAction(null)}
        onConfirm={(amount) => confirmingAction?.itemId && handleDeclareAmot(confirmingAction.itemId, amount)}
        itemName={confirmingAction?.item?.name || ''}
        initialAmount={confirmingAction?.item?.amotCost}
        isLoading={declareAmot.isPending}
      />

      <AddItemModal
        dropId={drop.id}
        isOpen={isAddItemOpen}
        isOrganiser={isOrganiser}
        onClose={() => setIsAddItemOpen(false)}
      />

      <AmotSheet
        open={isAmotSheetOpen}
        onOpenChange={(open) => {
          setIsAmotSheetOpen(open);
          if (!open) setSelectedAmotItem(undefined);
        }}
        dropId={drop.id}
        drop={drop}
        item={selectedAmotItem}
        carrierName={selectedAmotItem?.assignedUser?.firstName}
        activeCrew={activeCrew}
      />

      <AmotLogModal
        dropId={drop.id}
        isOpen={isAmotLogOpen}
        onClose={() => setIsAmotLogOpen(false)}
      />
    </div>
  );
}

type ItemMode = 'gear' | 'list-only' | 'expense';

function AddItemModal({
  dropId,
  isOpen,
  isOrganiser,
  onClose,
}: {
  dropId: string;
  isOpen: boolean;
  isOrganiser: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ItemMode>(isOrganiser ? 'gear' : 'list-only');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const addItem = useAddItem(dropId);
  const submitExpense = useSubmitExpenseLog(dropId);

  useEffect(() => {
    if (isOpen) {
      setMode(isOrganiser ? 'gear' : 'list-only');
      setName('');
      setDescription('');
      setAmount('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPending = addItem.isPending || submitExpense.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'expense') {
        const val = parseFloat(amount);
        if (!description.trim() || isNaN(val) || val <= 0) return;
        await submitExpense.mutateAsync({ description: description.trim(), amount: val });
        toast.success('EXPENSE LOGGED — PENDING CHIEF APPROVAL');
      } else {
        if (!name.trim()) return;
        await addItem.mutateAsync({ name: name.trim(), isAssignable: mode === 'gear' });
        toast.success('GEAR ADDED');
      }
      onClose();
    } catch {
      toast.error(mode === 'expense' ? 'FAILED TO LOG EXPENSE' : 'FAILED TO ADD GEAR');
    }
  };

  const modes: { id: ItemMode; label: string }[] = [
    ...(isOrganiser ? [{ id: 'gear' as ItemMode, label: 'Gear' }] : []),
    { id: 'list-only', label: 'List Only' },
    { id: 'expense', label: 'Expense' },
  ];

  const accentColor =
    mode === 'expense' ? 'border-amber-400' :
    mode === 'list-only' ? 'border-tok-black/30' :
    'border-tok-teal';

  const submitBg =
    mode === 'expense' ? 'bg-amber-400 text-tok-black' :
    'bg-tok-teal text-tok-cream';

  const isValid =
    mode === 'expense'
      ? description.trim().length > 0 && parseFloat(amount) > 0
      : name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tok-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-tok-black px-6 py-4">
          <div>
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-cream/40">Drop Supplies</p>
            <h3 className="font-passion text-lg font-bold uppercase tracking-wider text-tok-cream leading-none">Add Item</h3>
          </div>
          <button onClick={onClose} className="text-tok-cream/50 transition-colors hover:text-tok-cream">
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Mode toggle */}
          <div className={`mb-5 flex rounded-sm border-2 transition-colors duration-200 ${accentColor}`}>
            {modes.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  'flex-1 py-2 font-passion text-[10px] font-bold uppercase tracking-widest transition-colors',
                  mode === id
                    ? id === 'expense' ? 'bg-amber-400 text-tok-black' : id === 'list-only' ? 'bg-tok-black/10 text-tok-black' : 'bg-tok-teal text-tok-cream'
                    : 'bg-transparent text-tok-black/40 hover:text-tok-black/70',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contextual hint */}
          <p className="mb-4 font-passion text-[10px] font-bold uppercase tracking-widest text-tok-black/35">
            {mode === 'gear' && 'Crew can volunteer to bring this.'}
            {mode === 'list-only' && 'A reminder — not assigned to anyone.'}
            {mode === 'expense' && 'Chief reviews before it enters the cost split.'}
          </p>

          {mode === 'expense' ? (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  What was bought?
                </label>
                <input
                  autoFocus
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beer, chips, ice…"
                  maxLength={200}
                  className="h-11 w-full rounded-sm border-2 border-tok-black bg-white px-4 font-passion text-base font-bold text-tok-black outline-none focus:border-amber-400 placeholder:text-tok-black/20"
                />
              </div>
              <div className="mb-6">
                <label className="mb-1.5 block font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                  How much?
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tok-black/40">
                    <IconPeso size={18} strokeWidth={3} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="0.00"
                    className="h-14 w-full rounded-sm border-2 border-tok-black bg-white pl-11 pr-4 font-passion text-2xl font-bold text-tok-black outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <label className="mb-1.5 block font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
                Item name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === 'gear' ? 'e.g. Extension cord' : 'e.g. Trash bags'}
                maxLength={100}
                className={cn(
                  'h-11 w-full rounded-sm border-2 border-tok-black bg-white px-4 font-passion text-base font-bold text-tok-black outline-none placeholder:text-tok-black/20',
                  mode === 'gear' ? 'focus:border-tok-teal' : 'focus:border-tok-black/40',
                )}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border-2 border-tok-black bg-white py-3 font-passion text-xs font-bold uppercase tracking-widest text-tok-black transition-all hover:bg-tok-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !isValid}
              className={cn(
                'flex-1 rounded-sm border-2 border-tok-black py-3 font-passion text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50',
                submitBg,
              )}
            >
              {isPending
                ? <IconLoader size={14} className="animate-spin mx-auto" />
                : mode === 'expense' ? 'Submit' : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function DropSuppliesAccordion({
  drop,
  isOrganiser,
  isCrewMember,
  currentUser,
  activeCrew,
}: NeededItemsProps) {
  const hasContent = (drop.neededItems?.length ?? 0) > 0;
  const [isOpen, setIsOpen] = useState(hasContent);
  const { data: logs = [] } = useExpenseLogs(drop.id);
  const pendingExpenseCount = isOrganiser ? logs.filter((l) => l.status === 'pending').length : 0;

  return (
    <div className="mb-10 rounded-[4px] border-[3px] border-tok-black bg-white shadow-[6px_6px_0px_#1C1C1A]">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-tok-black/[0.02]"
      >
        <div className="flex items-center gap-3">
          <IconPackage size={16} strokeWidth={2.5} className="shrink-0 text-tok-teal" />
          <span className="font-passion text-lg font-bold uppercase tracking-tight text-tok-black leading-none">
            Drop Supplies.
          </span>
          {isOrganiser && pendingExpenseCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 font-passion text-[10px] font-bold text-tok-black">
              {pendingExpenseCount}
            </span>
          )}
        </div>
        <IconChevron
          size={16}
          strokeWidth={2.5}
          className={cn('shrink-0 text-tok-black/40 transition-transform duration-200', isOpen && 'rotate-90')}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="supplies-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-tok-black/10 px-5 py-4">
              <NeededItems
                drop={drop}
                isOrganiser={isOrganiser}
                isCrewMember={isCrewMember}
                currentUser={currentUser}
                activeCrew={activeCrew}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeclareCostModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  initialAmount,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  itemName: string;
  initialAmount?: number;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) setAmount(initialAmount?.toString() || '');
  }, [isOpen, initialAmount]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) onConfirm(val);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tok-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
      >
        <div className="bg-tok-black px-6 py-4">
          <h3 className="font-passion text-lg font-bold uppercase tracking-wider text-tok-cream">Declare Amot Cost</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-4 font-passion text-[11px] font-bold uppercase tracking-widest text-tok-black/40">
            Item: <span className="text-sm text-tok-black">{itemName}</span>
          </p>

          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tok-black/40">
              <IconPeso size={20} strokeWidth={3} />
            </div>
            <input
              autoFocus
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="0.00"
              className="h-14 w-full rounded-sm border-2 border-tok-black bg-white pl-12 pr-4 font-passion text-2xl font-bold text-tok-black outline-none focus:border-tok-teal [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border-2 border-tok-black bg-white py-3 font-passion text-xs font-bold uppercase tracking-widest text-tok-black transition-all hover:bg-tok-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-sm border-2 border-tok-black bg-amber-400 py-3 font-passion text-xs font-bold uppercase tracking-widest text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Declare'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
