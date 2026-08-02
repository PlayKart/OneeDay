// src/hooks/useNotifications.ts

import { useNotificationStore } from "../store/notificationStore";

export function useNotifications() {
  const { notifications, addNotification, markAsRead, clearNotifications } =
    useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  };
}
