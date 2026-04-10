import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface NotificationStore {
  notifications: Notification[];
  notify: (message: string, type?: Notification['type']) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  notify: (message, type = 'info') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 4000);
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
