import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { useAuth } from '@/components/providers/auth-provider';
import { notificationKeys } from '@/hooks/queries/use-notifications';

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { dbUser } = useAuth();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      if (!dbUser) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all(dbUser.id) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(dbUser.id) });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { dbUser } = useAuth();

  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      if (!dbUser) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all(dbUser.id) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(dbUser.id) });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  const { dbUser } = useAuth();

  return useMutation({
    mutationFn: () => notificationsService.clearAll(),
    onSuccess: () => {
      if (!dbUser) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all(dbUser.id) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(dbUser.id) });
    },
  });
}
