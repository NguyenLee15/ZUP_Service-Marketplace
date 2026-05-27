import { create } from 'zustand';
import api from '../../lib/axios';
import { unwrapData } from '../../lib/api-response';
import { storage } from '../../lib/storage';

export interface CustomerUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
}

interface AuthState {
  user: CustomerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: CustomerUser) => void;
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

  loadFromStorage: async () => {
    try {
      const [token, user] = await Promise.all([
        storage.getAccessToken(),
        storage.getUser<CustomerUser>(),
      ]);
      if (token && user?.role === 'CUSTOMER') {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        if (token) await storage.clearAll();
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    const res = await api.get('/auth/profile');
    const user = unwrapData<CustomerUser>(res);
    if (user?.role === 'CUSTOMER') {
      set({ user, isAuthenticated: true });
      storage.setUser(user);
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
}));
