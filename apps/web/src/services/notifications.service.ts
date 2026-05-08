import { api } from '@/services/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, string | null> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  data: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export const notificationsService = {
  getAll(page = 1, limit = 30): Promise<NotificationsPage> {
    return api.get<NotificationsPage>('/notifications', { params: { page, limit } }).then((r) => r.data);
  },

  getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data);
  },

  markRead(id: string): Promise<void> {
    return api.patch(`/notifications/${id}/read`).then(() => undefined);
  },

  markAllRead(): Promise<void> {
    return api.patch('/notifications/read-all').then(() => undefined);
  },

  clearAll(): Promise<void> {
    return api.delete('/notifications').then(() => undefined);
  },
};
