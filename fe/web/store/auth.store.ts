import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/types';
import { useServiceStore } from './service.store';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setTokens: (accessToken?: string | null, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  logout: () => void;

  // Computed helpers
  isAuthenticated: () => boolean;
  isProvider: () => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setTokens: (accessToken) =>
        set({ accessToken: accessToken || null, refreshToken: null }),

      setUser: (user) => set({ user }),

      logout: () => {
        useServiceStore.getState().clearStore();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },

      isAuthenticated: () => !!get().user,
      isProvider: () => get().user?.role === Role.PROVIDER,
      isAdmin: () => get().user?.role === Role.ADMIN,
      isStaff: () => get().user?.role === Role.STAFF,
      isCustomer: () => get().user?.role === Role.CUSTOMER,
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ user: state.user }),
      version: 2,
      merge: (persisted, current) => ({
        ...current,
        user: (persisted as Partial<AuthState> | undefined)?.user ?? null,
        accessToken: null,
        refreshToken: null,
      }),
    }
  )
);
