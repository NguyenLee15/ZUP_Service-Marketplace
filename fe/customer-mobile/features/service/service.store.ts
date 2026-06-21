import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ServiceItem {
  id: number;
  name: string;
  referencePrice?: number | null;
  avgRating?: number | null;
  totalReviews?: number | null;
  provider?: {
    id?: number;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
  images?: { id?: number; url?: string; displayOrder?: number }[];
  category?: { id?: number; name?: string };
  [key: string]: any;
}

interface ServiceState {
  favoriteServices: ServiceItem[];
  toggleFavorite: (service: ServiceItem) => void;
  clearStore: () => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set) => ({
      favoriteServices: [],
      toggleFavorite: (service) =>
        set((state) => {
          const exists = state.favoriteServices.some((s) => s.id === service.id);
          if (exists) {
            return { favoriteServices: state.favoriteServices.filter((s) => s.id !== service.id) };
          }
          return { favoriteServices: [service, ...state.favoriteServices] };
        }),
      clearStore: () => set({ favoriteServices: [] }),
    }),
    {
      name: 'customer-service-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
