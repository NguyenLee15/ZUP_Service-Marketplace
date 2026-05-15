/**
 * Auth store — Zustand + SecureStore persistence
 */
import { create } from 'zustand';
import { storage } from '../../lib/storage';
import api from '../../lib/axios';

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
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

  setTokens: async (accessToken, refreshToken) => {
    await storage.setTokens(accessToken, refreshToken);
  },

  // Gọi khi app khởi động — khôi phục session
  loadFromStorage: async () => {
    try {
      const [token, user] = await Promise.all([
        storage.getAccessToken(),
        storage.getUser(),
      ]);
      if (token && user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data?.data) {
        const user = res.data.data;
        set({ user });
        storage.setUser(user);
      }
    } catch {}
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
}));
