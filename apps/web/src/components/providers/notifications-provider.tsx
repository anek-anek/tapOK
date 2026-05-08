'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { connectNotificationsSocket, disconnectNotificationsSocket, getNotificationsSocket } from '@/lib/socket';
import type { Notification } from '@/services/notifications.service';
import { notificationKeys } from '@/hooks/queries/use-notifications';

interface NotificationsContextValue {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  unreadCount: 0,
  setUnreadCount: () => undefined,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { dbUser, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const connectedRef = useRef(false);

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      if (!dbUser) return;
      queryClient.setQueryData(
        notificationKeys.all(dbUser.id),
        (old: { data: Notification[]; total: number; page: number; totalPages: number } | undefined) => {
          if (!old) return old;
          return { ...old, data: [notification, ...old.data], total: old.total + 1 };
        },
      );
      setUnreadCount((c) => c + 1);
    },
    [dbUser, queryClient],
  );

  useEffect(() => {
    if (!isReady || !dbUser) {
      if (connectedRef.current) {
        disconnectNotificationsSocket();
        connectedRef.current = false;
      }
      return;
    }

    const socket = getNotificationsSocket();

    socket.off('notification', handleNewNotification);
    socket.on('notification', handleNewNotification);

    if (!connectedRef.current) {
      connectNotificationsSocket();
      connectedRef.current = true;
    }

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [isReady, dbUser, handleNewNotification]);

  // Sync unread count from query cache on initial load
  useEffect(() => {
    if (!dbUser) return;
    const cached = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount(dbUser.id));
    if (cached) setUnreadCount(cached.count);
  }, [dbUser, queryClient]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  return useContext(NotificationsContext);
}
