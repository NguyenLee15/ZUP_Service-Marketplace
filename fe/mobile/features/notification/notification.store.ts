/**
 * Notification store — badge count + realtime updates
 */
import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  bookingSignal: { bookingId: number; token: number } | null;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  signalBookingChanged: (bookingId: number) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  bookingSignal: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  signalBookingChanged: (bookingId) =>
    set({ bookingSignal: { bookingId, token: Date.now() } }),
  reset: () => set({ unreadCount: 0 }),
}));
