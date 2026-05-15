import { create } from 'zustand';
import { BookingStatus } from '@/types';

export interface BookingCache {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  serviceName: string;
  providerName?: string;
  customerName?: string;
  desiredTime: string;
  createdAt: string;
}

interface BookingState {
  currentBooking: BookingCache | null;
  recentBookings: BookingCache[];

  // Actions
  setCurrentBooking: (booking: BookingCache | null) => void;
  setRecentBookings: (bookings: BookingCache[]) => void;
  updateBookingStatus: (id: number, status: BookingStatus) => void;
  clearCache: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  currentBooking: null,
  recentBookings: [],

  setCurrentBooking: (booking) => set({ currentBooking: booking }),

  setRecentBookings: (bookings) => set({ recentBookings: bookings }),

  updateBookingStatus: (id, status) =>
    set((state) => ({
      currentBooking:
        state.currentBooking?.id === id
          ? { ...state.currentBooking, status }
          : state.currentBooking,
      recentBookings: state.recentBookings.map((b) =>
        b.id === id ? { ...b, status } : b,
      ),
    })),

  clearCache: () => set({ currentBooking: null, recentBookings: [] }),
}));
