'use client';

import {
  Check as IconCheck,
  Users as IconUsersGroup,
  Hand as IconHandClick,
  MoreVertical as IconDotsVertical
} from 'lucide-react';
import Image from 'next/image';
import {
  useAssignItem,
  useUnassignItem,
  useRandomAssignItems,
  usePickItem
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

function getLogInitials(first: string, last: string) {
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

  const handleUnassignItem = async (itemId: string) => {
    try {
      await unassignItem.mutateAsync(itemId);
      toast.success('ITEM UNASSIGNED');
    } catch {
      toast.error('FAILED TO UNASSIGN ITEM');
    }
  };

  const handleAssignItem = async (itemId: string, member: CrewMember) => {
    try {
      await assignItem.mutateAsync({
        itemId,
        assignedUserId: member.userId,
        assignedUser: { ...member.user },
      });
      toast.success('ITEM ASSIGNED');
    } catch {
      toast.error('FAILED TO ASSIGN ITEM');
    }
  };

  const handleRandomAssign = async () => {
    try {
      await randomAssign.mutateAsync();
      toast.success('ITEMS RANDOMLY ASSIGNED');
    } catch {
      toast.error('FAILED TO ASSIGN ITEMS');
    }
  };

  const handlePickItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      await pickItem.mutateAsync({ itemId, user: currentUser });
      toast.success('ITEM PICKED!');
    } catch {
      toast.error('FAILED TO PICK ITEM');
    }
  };

  const items = drop.neededItems || [];
  const unassignedCount = items.filter(i => !i.assignedUserId).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-passion text-xl font-bold uppercase tracking-tight text-tok-black">
            Needed Items.
          </h3>
          <p className="font-passion text-[10px] font-bold uppercase tracking-wider text-tok-black/40">
            {items.length} items total • {unassignedCount} unassigned
          </p>
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

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative flex items-center justify-between gap-4 rounded-sm border-[3px] border-tok-black bg-white p-3 shadow-[5px_5px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#1C1C1A]"
          >
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-tok-black transition-colors",
                item.assignedUserId ? "bg-tok-teal text-tok-cream" : "bg-tok-cream/50 text-tok-black/20"
              )}>
                {item.assignedUserId ? <IconCheck size={18} strokeWidth={3} /> : <div className="h-2 w-2 rounded-full bg-tok-black/10" />}
              </div>
              <div className="min-w-0">
                <p className="font-passion text-sm font-bold uppercase tracking-wide text-tok-black truncate">
                  {item.name}
                </p>
                {item.assignedUser ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-tok-black bg-tok-teal font-passion text-[6px] font-bold text-tok-cream">
                      {item.assignedUser.avatar ? (
                        <Image src={item.assignedUser.avatar} alt="" width={16} height={16} className="h-full w-full object-cover" />
                      ) : (
                        getLogInitials(item.assignedUser.firstName, item.assignedUser.lastName)
                      )}
                    </div>
                    <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-tok-black/40">
                      Assigned to {item.assignedUser.firstName}
                    </span>
                  </div>
                ) : (
                  <span className="font-passion text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    Unassigned
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCrewMember && (item.assignedUserId === currentUser?.id || !item.assignedUserId) && (
                <button
                  onClick={() => item.assignedUserId === currentUser?.id
                    ? void handleUnassignItem(item.id)
                    : void handlePickItem(item.id)
                  }
                  disabled={pickItem.isPending || unassignItem.isPending}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-sm border-2 border-tok-black px-3 font-passion text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50",
                    item.assignedUserId === currentUser?.id
                      ? "bg-white text-tok-black"
                      : "bg-tok-teal text-tok-cream"
                  )}
                >
                  <IconHandClick size={14} strokeWidth={2.5} />
                  <span>{item.assignedUserId === currentUser?.id ? 'Unpick' : 'Pick This'}</span>
                </button>
              )}

              {isOrganiser && (
                <Popover>
                  <PopoverTrigger className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-tok-black bg-white text-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1C1C1A] active:translate-y-0 active:shadow-none">
                    <IconDotsVertical size={16} strokeWidth={2.5} />
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
                          const isAssigned = item.assignedUserId === member.userId;
                          return (
                            <button
                              key={member.userId}
                              onClick={() => isAssigned
                                ? void handleUnassignItem(item.id)
                                : void handleAssignItem(item.id, member)
                              }
                              disabled={assignItem.isPending || unassignItem.isPending}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-none px-2 py-2 text-left font-passion text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50",
                                isAssigned
                                  ? "bg-tok-teal text-tok-cream hover:bg-red-500"
                                  : "text-tok-black hover:bg-tok-teal hover:text-tok-cream"
                              )}
                            >
                              <div className={cn(
                                "h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border font-passion text-[8px] font-bold",
                                isAssigned ? "border-tok-cream bg-tok-cream text-tok-teal" : "border-tok-black bg-tok-teal text-tok-cream"
                              )}>
                                {member.user?.avatar ? (
                                  <Image src={member.user.avatar} alt="" width={20} height={20} className="h-full w-full object-cover" />
                                ) : (
                                  getLogInitials(member.user?.firstName || '?', member.user?.lastName || '')
                                )}
                              </div>
                              <span className="truncate flex-1">{member.user?.firstName} {member.user?.lastName}</span>
                              {isAssigned && <IconCheck size={12} strokeWidth={3} />}
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
        ))}
      </div>
    </div>
  );
}
