'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Heart, MessageSquare, Package, User } from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';

function isUnauthorizedError(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
  };

  return candidate?.response?.status === 401 || candidate?.status === 401;
}

export function HomeHeaderAuth() {
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const favoriteCount = useServiceStore((state) => state.favorites.length);
  const authenticated = mounted && isAuthenticated();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function loadAccountSummary() {
      const [{ authApi }, { notificationsApi }] = await Promise.all([
        import('@/features/auth/services/auth.api'),
        import('@/features/auth/services/api'),
      ]);

      if (cancelled) return;

      if (!user) {
        authApi.getProfile()
          .then((response) => {
            if (!cancelled) setUser(response.data.data);
          })
          .catch((error: unknown) => {
            if (!cancelled && isUnauthorizedError(error)) logout();
          });
      }

      notificationsApi.getUnreadCount()
        .then((response) => {
          if (!cancelled) setUnreadCount(Number(response.data.data?.count || 0));
        })
        .catch((error: unknown) => {
          if (!cancelled && isUnauthorizedError(error)) logout();
        });
    }

    void loadAccountSummary();

    return () => {
      cancelled = true;
    };
  }, [authenticated, logout, setUser, user]);

  if (!mounted) {
    return <div className="hidden h-9 w-20 rounded-full bg-pale-gray md:block" aria-hidden="true" />;
  }

  if (!authenticated) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/register"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-action-blue px-4 text-sm font-medium text-action-blue transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
        >
          Đăng ký
        </Link>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-action-blue px-4 text-sm font-medium text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const displayName = user?.fullName?.trim() || user?.email || 'Tài khoản';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/bookings"
        aria-label="Đơn hàng của tôi"
        className="hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-pale-gray hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue sm:flex"
      >
        <Package className="h-5 w-5" />
      </Link>
      <Link
        href="/chat"
        aria-label="Tin nhắn"
        className="hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-pale-gray hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue sm:flex"
      >
        <MessageSquare className="h-5 w-5" />
      </Link>
      <Link
        href="/favorites"
        aria-label="Dịch vụ yêu thích"
        className="relative hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-pale-gray hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue sm:flex"
      >
        <Heart className="h-5 w-5" />
        {favoriteCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            {favoriteCount > 9 ? '9+' : favoriteCount}
          </span>
        )}
      </Link>
      <Link
        href="/notifications"
        aria-label="Thông báo"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-pale-gray hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
      <Link
        href="/profile"
        aria-label="Tài khoản"
        className="hidden items-center gap-2 rounded-full border border-platinum-tint bg-white/90 py-1.5 pl-1 pr-3 transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue lg:flex"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-action-blue text-sm font-semibold text-white">
          {userInitial || <User className="h-4 w-4" />}
        </span>
        <span className="max-w-28 truncate text-sm font-medium text-foreground xl:max-w-36">
          {displayName}
        </span>
      </Link>
    </div>
  );
}
