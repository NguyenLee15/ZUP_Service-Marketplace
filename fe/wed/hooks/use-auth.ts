'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/features/auth/services/auth.api';
import { Role } from '@/types';
import { connectSockets, disconnectSockets } from '@/lib/socket';

/**
 * Global auth hook — dùng ở nhiều feature.
 * Luồng: page → useAuth() → authApi → lib/axios
 */
export function useAuth() {
  const router = useRouter();
  const { setTokens, setUser, logout: clearStore, user } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      setTokens(accessToken, refreshToken);
      setUser(userData);
      connectSockets();

      // Redirect theo role
      switch (userData.role) {
        case Role.ADMIN:
        case Role.STAFF:
          router.push('/admin/dashboard');
          break;
        case Role.PROVIDER:
          router.push('/provider/dashboard');
          break;
        case Role.CUSTOMER:
        default:
          router.push('/');
          break;
      }
    },
    [router, setTokens, setUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      disconnectSockets();
      clearStore();
      router.push('/login');
    }
  }, [router, clearStore]);

  const register = useCallback(
    async (data: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
    }) => {
      const res = await authApi.register(data);
      return res.data;
    },
    [],
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      const res = await authApi.verifyOtp({ email, otp });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      setTokens(accessToken, refreshToken);
      setUser(userData);
      connectSockets();

      // Redirect theo role sau verify
      if (userData.role === Role.PROVIDER) {
        router.push('/provider/kyc');
      } else {
        router.push('/');
      }
    },
    [router, setTokens, setUser],
  );

  return {
    user,
    login,
    logout,
    register,
    verifyOtp,
    isAuthenticated: !!useAuthStore.getState().accessToken,
  };
}
