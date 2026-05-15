import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Service } from '@/types';

interface ServiceState {
  favorites: number[];
  favoriteServices: Service[];
  comparisonList: Service[];
  recentlyViewed: Service[];
  toggleFavorite: (id: number) => void;
  toggleFavoriteService: (service: Service) => void;
  removeFavorite: (id: number) => void;
  addToComparison: (service: Service) => void;
  removeFromComparison: (id: number) => void;
  clearComparison: () => void;
  addRecentlyViewed: (service: Service) => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set) => ({
      favorites: [],
      favoriteServices: [],
      comparisonList: [],
      recentlyViewed: [],
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id],
        favoriteServices: state.favorites.includes(id)
          ? state.favoriteServices.filter((service) => service.id !== id)
          : state.favoriteServices,
      })),
      toggleFavoriteService: (service) => set((state) => {
        const isFavorite = state.favorites.includes(service.id);

        if (isFavorite) {
          return {
            favorites: state.favorites.filter((id) => id !== service.id),
            favoriteServices: state.favoriteServices.filter((item) => item.id !== service.id),
          };
        }

        return {
          favorites: [...state.favorites, service.id],
          favoriteServices: [
            service,
            ...state.favoriteServices.filter((item) => item.id !== service.id),
          ],
        };
      }),
      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter((favoriteId) => favoriteId !== id),
        favoriteServices: state.favoriteServices.filter((service) => service.id !== id),
      })),
      addToComparison: (service) => set((state) => {
        if (state.comparisonList.some(s => s.id === service.id)) return state;
        if (state.comparisonList.length >= 3) return state;
        return { comparisonList: [...state.comparisonList, service] };
      }),
      removeFromComparison: (id) => set((state) => ({
        comparisonList: state.comparisonList.filter((s) => s.id !== id),
      })),
      clearComparison: () => set({ comparisonList: [] }),
      addRecentlyViewed: (service) => set((state) => {
        const filtered = state.recentlyViewed.filter(s => s.id !== service.id);
        return { recentlyViewed: [service, ...filtered].slice(0, 10) };
      }),
    }),
    {
      name: 'service-storage',
      partialize: (state) => ({ 
        favorites: state.favorites,
        favoriteServices: state.favoriteServices,
        recentlyViewed: state.recentlyViewed 
      }),
    }
  )
);
