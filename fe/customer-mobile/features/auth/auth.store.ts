import { create } from 'zustand';
import api from '../../lib/axios';
import { unwrapData } from '../../lib/api-response';
import { storage } from '../../lib/storage';
import { queryClient } from '../../lib/query-client';
import { authApi } from './auth.api';

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

  setUser: (user: CustomerUser) => {
    set({ user, isAuthenticated: true, isLoading: false });
    storage.setUser(user);
  },

  setTokens: async (accessToken, refreshToken) => {
    await storage.setTokens(accessToken, refreshToken);
  },

  loadFromStorage: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const savedUser = await storage.getUser<CustomerUser>();
      if (savedUser) {
        set({ user: savedUser, isAuthenticated: true });
      }

      const res = await api.get('/auth/profile');
      const user = unwrapData<CustomerUser>(res);
      if (user?.role === 'CUSTOMER' && user.status !== 'LOCKED') {
        await storage.setUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      await storage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        await storage.clearAll();
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        const savedUser = await storage.getUser<CustomerUser>();
        if (savedUser) {
          set({ user: savedUser, isAuthenticated: true, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      const user = unwrapData<CustomerUser>(res);
      if (user?.role === 'CUSTOMER' && user.status !== 'LOCKED') {
        set({ user, isAuthenticated: true });
        await storage.setUser(user);
        return;
      }
      await storage.clearAll();
      set({ user: null, isAuthenticated: false });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        await storage.clearAll();
        set({ user: null, isAuthenticated: false });
      }
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors so local session is always wiped
    }
    queryClient.clear();
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
}));
