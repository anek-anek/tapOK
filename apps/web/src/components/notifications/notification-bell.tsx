'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell as IconBell, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/queries/use-notifications';
import { useMarkNotificationRead, useMarkAllNotificationsRead, useClearAllNotifications } from '@/hooks/mutations/use-notification-mutations';
import { useNotificationsContext } from '@/components/providers/notifications-provider';
import type { Notification } from '@/services/notifications.service';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notificationsPage } = useNotifications(1, 10);
  const { data: countData } = useUnreadNotificationCount();
  const { unreadCount, setUnreadCount } = useNotificationsContext();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();

  // Sync unread count from server on mount / query refresh
  useEffect(() => {
    if (countData?.count !== undefined) {
      setUnreadCount(countData.count);
    }
  }, [countData, setUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    if (notification.metadata?.dropId) {
      router.push(`/drops/${notification.metadata.dropId}`);
    }
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
    setUnreadCount(0);
  }

  function handleClearAll() {
    clearAll.mutate();
    setUnreadCount(0);
  }

  const displayCount = Math.max(unreadCount, countData?.count ?? 0);
  const notifications = notificationsPage?.data ?? [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-tok-black bg-white text-tok-black shadow-[3px_3px_0px_0px_#262624] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#262624] focus-visible:outline-hidden active:translate-y-0 active:shadow-none"
        aria-label="Notifications"
      >
        <IconBell size={18} strokeWidth={2.5} />
        {displayCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-tok-black bg-tok-teal px-0.5 font-inter text-[8px] font-bold leading-none text-white">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-[calc(100%+12px)] z-30 w-[340px] max-w-[calc(100vw-1rem)] overflow-hidden border-2 border-tok-black bg-white shadow-[6px_6px_0px_0px_#262624] max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-[72px] max-sm:w-auto max-sm:max-w-none"
          >
            <div className="flex items-center justify-between border-b-2 border-tok-black bg-tok-teal/5 px-4 py-3">
              <p className="font-passion text-sm uppercase tracking-[2px] text-tok-black">Notifications</p>
              <div className="flex items-center gap-3">
                {displayCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 font-inter text-[10px] font-bold uppercase tracking-wide text-tok-black/50 hover:text-tok-black"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1 font-inter text-[10px] font-bold uppercase tracking-wide text-tok-black/50 hover:text-tok-black"
                  >
                    <Trash2 size={12} />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto sm:max-h-[360px]">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center font-inter text-xs font-medium text-tok-black/40">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-tok-black/10 px-4 py-3 text-left transition-colors ${!n.isRead ? 'bg-tok-teal/10 hover:bg-tok-teal/15' : 'hover:bg-tok-black/5'}`}
                  >
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tok-teal" />
                    )}
                    {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-inter text-xs font-semibold leading-snug text-tok-black">{n.title}</p>
                      <p className="mt-0.5 font-inter text-[11px] leading-snug text-tok-black/70">{n.body}</p>
                      <p className="mt-1 font-inter text-[10px] text-tok-black/30">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
