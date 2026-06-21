/**
 * Auth store — Zustand + SecureStore persistence
 */
import { create } from "zustand";
import { storage } from "../../lib/storage";
import api from "../../lib/axios";

export interface ProviderUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  isOnline?: boolean;
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface AuthState {
  user: ProviderUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: ProviderUser) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    storage.setUser(user);
  },

  setOnlineStatus: (isOnline) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, isOnline };
      storage.setUser(updatedUser);
      return { user: updatedUser };
    });
  },

  setTokens: async (accessToken, refreshToken) => {
    await storage.setTokens(accessToken, refreshToken);
  },

  // Gọi khi app khởi động — khôi phục session
  loadFromStorage: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await api.get("/auth/profile");
      const user = res.data?.data as ProviderUser | undefined;
      if (user?.role === "PROVIDER" && user.status !== "LOCKED") {
        await storage.setUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      await storage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      await storage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get("/users/profile");
      const user = res.data?.data as ProviderUser | undefined;
      if (user?.role === "PROVIDER" && user.status !== "LOCKED") {
        set({ user, isAuthenticated: true });
        storage.setUser(user);
        return;
      }
      await storage.clearAll();
      set({ user: null, isAuthenticated: false });
    } catch {
      await storage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
}));
