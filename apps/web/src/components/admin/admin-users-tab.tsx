'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/queries/use-users';
import { usersService } from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Trash2, User as UserIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { userKeys } from '@/hooks/queries/use-users';
import { ConfirmModal } from '../shared/ConfirmModal';
import { AdminUserSummaryModal } from './admin-summary-modals';
import type { User } from '@/types/user';

export function AdminUsersTab() {
  const { data: users, isLoading } = useUsers();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmModalId, setConfirmModalId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await usersService.remove(id);
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      // Invalidate drops too since many might have been deleted if this user was a chief
      await queryClient.invalidateQueries({ queryKey: ['drops'] });
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    } finally {
      setDeletingId(null);
      setConfirmModalId(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center font-passion uppercase tracking-widest text-tok-black/40">Loading users...</div>;

  return (
    <div className="flex flex-col gap-3">
      <ConfirmModal
        isOpen={!!confirmModalId}
        onClose={() => setConfirmModalId(null)}
        onConfirm={() => confirmModalId && handleDelete(confirmModalId)}
        title="Delete User?"
        description="Are you sure you want to delete this user? This will also delete all drops they organised and remove them from all crew rosters. This action is permanent."
        confirmText="Delete User"
        isLoading={!!deletingId}
      />
      <AdminUserSummaryModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
      {users?.map((user) => (
        <div key={user.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border-2 border-tok-black bg-white p-4 shadow-[4px_4px_0px_#1C1C1A] gap-4 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer" onClick={() => setSelectedUser(user)}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-tok-black bg-tok-teal/10 overflow-hidden relative">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.firstName} fill className="object-cover" />
              ) : (
                <UserIcon className="text-tok-teal" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-passion text-lg uppercase tracking-tight text-tok-black truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="font-inter text-xs font-bold text-tok-black/40 lowercase truncate">
                {user.email} • {user.role}
              </p>
            </div>
          </div>
          <div className="flex sm:justify-end">
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModalId(user.id);
              }}
              disabled={deletingId === user.id}
              className="rounded-sm border-2 border-tok-black shadow-[2px_2px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1C1C1A] active:translate-y-0 active:shadow-none w-full sm:w-10 h-10"
            >
              <Trash2 size={18} className="sm:mx-0" />
              <span className="sm:hidden ml-2 font-passion uppercase text-xs tracking-widest">Delete User</span>
            </Button>
          </div>
        </div>
      ))}
      {users?.length === 0 && (
        <div className="py-12 text-center text-tok-black/40 font-passion uppercase tracking-widest">No users found.</div>
      )}
    </div>
  );
}
