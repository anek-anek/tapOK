import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { useAuth } from '@/components/providers/auth-provider';

export const notificationKeys = {
  all: (uid: string) => ['notifications', uid] as const,
  unreadCount: (uid: string) => ['notifications', uid, 'unread-count'] as const,
};

export function useNotifications(page = 1, limit = 30) {
  const { dbUser, isReady } = useAuth();
  return useQuery({
    queryKey: notificationKeys.all(dbUser?.id ?? ''),
    queryFn: () => notificationsService.getAll(page, limit),
    enabled: isReady && !!dbUser,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const { dbUser, isReady } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unreadCount(dbUser?.id ?? ''),
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: isReady && !!dbUser,
    staleTime: 30_000,
  });
}
