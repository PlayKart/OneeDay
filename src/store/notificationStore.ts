// src/store/notificationStore.ts

import { create } from "zustand";
import { NotificationItem } from "../types";

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: "init_1",
      title: "Welcome Back",
      message: "Stay on top of your daily habits to build unbreakable momentum.",
      type: "info",
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
  addNotification: (item) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ notifications: [newItem, ...state.notifications] }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  clearNotifications: () => set({ notifications: [] }),
}));
