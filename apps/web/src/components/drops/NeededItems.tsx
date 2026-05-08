'use client';

import {
  Check as IconCheck,
  Users as IconUsersGroup,
  Hand as IconHandClick,
  X as IconX,
  ChevronDown as IconChevronDown,
  Minus as IconMinus,
} from 'lucide-react';
import Image from 'next/image';
import {
  useAssignItem,
  useUnassignItem,
  useRandomAssignItems,
  usePickItem,
  useConfirmItem,
} from '@/hooks/mutations/use-drop-mutations';
import type { Drop, CrewMember } from '@/types/drop';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

export function NeededItems({
  drop,
  isOrganiser,
  isCrewMember,
  currentUser,
  activeCrew
}: NeededItemsProps) {
  const assignItem = useAssignItem(drop.id);
  const unassignItem = useUnassignItem(drop.id);
  const randomAssign = useRandomAssignItems(drop.id);
  const pickItem = usePickItem(drop.id);
  const confirmItem = useConfirmItem(drop.id);

  const handleUnassignItem = async (itemId: string) => {
    try {
      await unassignItem.mutateAsync(itemId);
      toast.success('GEAR UNASSIGNED');
    } catch {
      toast.error('FAILED TO UNASSIGN GEAR');
    }
  };

  const handleAssignItem = async (itemId: string, member: CrewMember) => {
    try {
      await assignItem.mutateAsync({
        itemId,
        assignedUserId: member.userId,
        assignedUser: { ...member.user },
      });
      toast.success('GEAR ASSIGNED');
    } catch {
      toast.error('FAILED TO ASSIGN GEAR');
    }
  };

  const handleRandomAssign = async () => {
    try {
      await randomAssign.mutateAsync();
      toast.success('GEAR DISTRIBUTED');
    } catch {
      toast.error('FAILED TO DISTRIBUTE GEAR');
    }
  };

  const handlePickItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      await pickItem.mutateAsync({ itemId, user: currentUser });
      toast.success('GEARED UP!');
    } catch {
      toast.error('FAILED TO BRING GEAR');
    }
  };

  const handleConfirmItem = async (itemId: string) => {
    try {
      await confirmItem.mutateAsync(itemId);
      toast.success('GEAR CONFIRMED ON-SITE');
    } catch {
      toast.error('FAILED TO CONFIRM GEAR');
    }
  };

  const items = drop.neededItems || [];
  const unassignedCount = items.filter(i => !i.assignedUserId).length;
  const assignedCount = items.length - unassignedCount;
  const hasAssignables = items.some(i => i.isAssignable);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
            Needed Gear.
          </h3>
          {hasAssignables && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/40">
                {items.length} items
              </span>
              <span className="font-passion text-[10px] text-tok-black/20">•</span>
              <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                {items.filter(i => i.isConfirmed).length} brought
              </span>
              {items.filter(i => i.isAssignable && !!i.assignedUserId && !i.isConfirmed).length > 0 && (
                <>
                  <span className="font-passion text-[10px] text-tok-black/20">•</span>
                  <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-teal">
                    {items.filter(i => i.isAssignable && !!i.assignedUserId && !i.isConfirmed).length} covered
                  </span>
                </>
              )}
              {items.filter(i => i.isAssignable && !i.assignedUserId).length > 0 && (
                <>
                  <span className="font-passion text-[10px] text-tok-black/20">•</span>
                  <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-amber-500">
                    {items.filter(i => i.isAssignable && !i.assignedUserId).length} needed
                  </span>
                </>
              )}
              {items.filter(i => !i.isAssignable).length > 0 && (
                <>
                  <span className="font-passion text-[10px] text-tok-black/20">•</span>
                  <span className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/40">
                    {items.filter(i => !i.isAssignable).length} list
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {isOrganiser && unassignedCount > 0 && activeCrew.length > 0 && (
          <button
            onClick={() => void handleRandomAssign()}
            disabled={randomAssign.isPending}
            className="flex h-9 items-center gap-2 rounded-sm border-2 border-tok-black bg-amber-400 px-3 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[3px_3px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
          >
            <IconUsersGroup size={14} strokeWidth={2.5} />
            <span>Random Assign</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const isAssignedToMe = item.assignedUserId === currentUser?.id;
          const isAssigned = !!item.assignedUserId;

          return (
            <div
              key={item.id}
              className="group relative flex items-center gap-0 rounded-sm border-[3px] border-tok-black overflow-hidden bg-white shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A]"
            >
              {/* Left accent stripe */}
              <div className={cn(
                "w-1.5 self-stretch shrink-0 transition-colors",
                item.isConfirmed ? "bg-emerald-500" : isAssigned ? "bg-tok-teal" : "bg-amber-400"
              )} />

              {/* Main content */}
              <div className="flex flex-1 min-w-0 px-3 py-2.5 flex-col justify-center gap-0.5">
                <p className="font-passion text-sm font-bold uppercase tracking-wide text-tok-black leading-tight wrap-break-word">
                  {item.name}
                </p>
                {(item.isAssignable || hasAssignables) && (
                  <div className="flex items-center gap-1.5 h-4 mt-0.5">
                    {!item.isAssignable ? (
                      <>
                        <IconMinus size={9} strokeWidth={3} className="text-tok-black/20 shrink-0" />
                        <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-tok-black/30">
                          Informational List
                        </span>
                      </>
                    ) : item.assignedUser ? (
                      <>
                        <div className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tok-black font-passion text-[6px] font-bold text-tok-cream",
                          item.isConfirmed ? "bg-emerald-500" : "bg-tok-teal"
                        )}>
                          {item.assignedUser.avatar ? (
                            <Image src={item.assignedUser.avatar} alt="" width={16} height={16} className="h-full w-full object-cover" />
                          ) : (
                            getInitials(item.assignedUser.firstName, item.assignedUser.lastName)
                          )}
                        </div>
                        <span className={cn(
                          "font-passion text-[9px] font-bold uppercase tracking-wider",
                          item.isConfirmed ? "text-emerald-600" : "text-tok-black/40"
                        )}>
                          {isAssignedToMe ? 'You' : item.assignedUser.firstName} {item.isConfirmed && 'Brought'}
                        </span>
                        <IconCheck size={9} strokeWidth={3} className={cn(item.isConfirmed ? "text-emerald-500" : "text-tok-teal", "shrink-0")} />
                      </>
                    ) : (
                      <>
                        <IconMinus size={9} strokeWidth={3} className="text-amber-400 shrink-0" />
                        <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-amber-500">
                          Needs Gear
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pr-2.5">
                {isCrewMember && item.isAssignable && (isAssignedToMe || !isAssigned) && (
                  <button
                    onClick={() => isAssignedToMe
                      ? void handleUnassignItem(item.id)
                      : void handlePickItem(item.id)
                    }
                    disabled={pickItem.isPending || unassignItem.isPending || item.isConfirmed}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black px-2.5 font-passion text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50",
                      isAssignedToMe
                        ? "bg-white text-tok-black hover:bg-red-50"
                        : "bg-tok-teal text-tok-cream"
                    )}
                  >
                    {isAssignedToMe
                      ? <IconX size={12} strokeWidth={3} />
                      : <IconHandClick size={12} strokeWidth={2.5} />
                    }
                    <span>{isAssignedToMe ? (item.isConfirmed ? 'Locked' : 'Release') : 'Bring Gear'}</span>
                  </button>
                )}

                {isOrganiser && isAssigned && !item.isConfirmed && (
                  <button
                    onClick={() => void handleConfirmItem(item.id)}
                    disabled={confirmItem.isPending}
                    className="flex h-8 items-center gap-1.5 rounded-sm border-2 border-tok-black bg-emerald-500 px-2.5 font-passion text-[10px] font-bold uppercase tracking-wider text-white shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
                  >
                    <IconCheck size={12} strokeWidth={3} />
                    <span>Confirm Arrival</span>
                  </button>
                )}

                {isOrganiser && item.isAssignable && !item.isConfirmed && (
                  <Popover>
                    <PopoverTrigger className="flex h-8 items-center gap-1 rounded-sm border-2 border-tok-black bg-white px-2 font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none">
                      <IconUsersGroup size={13} strokeWidth={2.5} />
                      <IconChevronDown size={10} strokeWidth={3} className="text-tok-black/40" />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 rounded-sm border-[3px] border-tok-black bg-tok-cream p-1 shadow-[4px_4px_0px_#1C1C1A]">
                      <div className="px-2 py-1.5">
                        <p className="font-passion text-[8px] font-bold uppercase tracking-[2px] text-tok-black/30">
                          Assign to Crew
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {activeCrew.length === 0 ? (
                          <div className="px-2 py-2">
                            <p className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/40">
                              No active crew
                            </p>
                          </div>
                        ) : (
                          activeCrew.map((member) => {
                            const isMemberAssigned = item.assignedUserId === member.userId;
                            return (
                              <button
                                key={member.userId}
                                onClick={() => isMemberAssigned
                                  ? void handleUnassignItem(item.id)
                                  : void handleAssignItem(item.id, member)
                                }
                                disabled={assignItem.isPending || unassignItem.isPending}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-none px-2 py-2 text-left font-passion text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50",
                                  isMemberAssigned
                                    ? "bg-tok-teal text-tok-cream hover:bg-red-500"
                                    : "text-tok-black hover:bg-tok-teal hover:text-tok-cream"
                                )}
                              >
                                <div className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border font-passion text-[8px] font-bold",
                                  isMemberAssigned ? "border-tok-cream bg-tok-cream text-tok-teal" : "border-tok-black bg-tok-teal text-tok-cream"
                                )}>
                                  {member.user?.avatar ? (
                                    <Image src={member.user.avatar} alt="" width={20} height={20} className="h-full w-full object-cover" />
                                  ) : (
                                    getInitials(member.user?.firstName || '?', member.user?.lastName || '')
                                  )}
                                </div>
                                <span className="truncate flex-1">{member.user?.firstName} {member.user?.lastName}</span>
                                {isMemberAssigned && <IconCheck size={12} strokeWidth={3} />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
