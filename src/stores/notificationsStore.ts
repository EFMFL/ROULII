import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification } from './types';
import { mockNotifications } from './mockData';

interface NotificationsState {
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id'>) => void;
}

export const useNotificationsStore = create<NotificationsState>()(persist((set) => ({
  notifications: mockNotifications,
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  addNotification: (notif) =>
    set((state) => ({
      notifications: [{ ...notif, id: `n${Date.now()}` }, ...state.notifications],
    })),
}), { name: 'roulii-notifications', version: 2 }));

// Selector helpers — compute derived state as primitives for stable subscriptions
export const selectUnreadCount = (s: NotificationsState) =>
  s.notifications.filter((n) => !n.read).length;
