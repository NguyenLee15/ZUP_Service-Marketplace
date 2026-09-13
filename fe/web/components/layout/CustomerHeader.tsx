'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';
import { Role } from '@/types';
import { HeaderLogo } from './header/HeaderLogo';
import { HeaderSearchBar } from './header/HeaderSearchBar';
import { HeaderUserActions } from './header/HeaderUserActions';
import { HeaderAccountMenu } from './header/HeaderAccountMenu';
import { HeaderMobileDrawer } from './header/HeaderMobileDrawer';

type NotificationPayload = {
  title?: string;
  content?: string;
};

function isUnauthorizedError(error: unknown) {
  const candidate = error as {
    response?: { status?: number };
    status?: number;
  };
  return candidate?.response?.status === 401 || candidate?.status === 401;
}

export function CustomerHeader() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated, logout: storeLogout, setUser } = useAuthStore();
  const router = useRouter();
  const isAdminOrStaff = user?.role === Role.ADMIN || user?.role === Role.STAFF;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      useNotificationStore.setState({ unreadCount: 0 });
      return;
    }

    let cancelled = false;
    const handleUnauthorized = () => {
      if (!cancelled) {
        storeLogout();
        router.push('/login');
      }
    };

    async function loadAccountData() {
      const [{ authApi }, { notificationsApi }] = await Promise.all([
        import('@/features/auth/services/auth.api'),
        import('@/features/auth/services/api'),
      ]);

      if (cancelled) return;

      if (!user) {
        authApi
          .getProfile()
          .then((res) => {
            if (!cancelled) setUser(res.data.data);
          })
          .catch((err: unknown) => {
            if (isUnauthorizedError(err)) {
              handleUnauthorized();
            }
          });
      }

      notificationsApi
        .getUnreadCount()
        .then((res) => {
          if (!cancelled)
            useNotificationStore.setState({
              unreadCount: Number(res.data.data?.count || 0),
            });
        })
        .catch((err: unknown) => {
          if (isUnauthorizedError(err)) {
            handleUnauthorized();
          }
        });
    }

    void loadAccountData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mounted, router, setUser, storeLogout, user]);

  const handleNotificationReceived = useCallback(
    (data: NotificationPayload) => {
      useNotificationStore.setState((state) => ({
        unreadCount: state.unreadCount + 1,
      }));
      void import('sonner').then(({ toast }) => {
        toast.info('Thông báo mới', {
          description:
            data?.title ||
            data?.content ||
            'Bạn vừa có một cập nhật mới từ ZUP.',
          duration: 5000,
          action: {
            label: 'Xem',
            onClick: () => router.push('/notifications'),
          },
        });
      });
    },
    [router]
  );

  useNotificationsSocket(handleNotificationReceived);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 border-b ${
          scrolled
            ? 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 shadow-sm'
            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800/60'
        } backdrop-blur-md`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 sm:gap-4 h-16">
            {/* Brand Logo */}
            <HeaderLogo />

            {/* Omni-Search with contextual scroll-aware reveal */}
            <HeaderSearchBar />

            {/* Actions & Profile Area */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {mounted && isAuthenticated() ? (
                <>
                  <HeaderUserActions isAdminOrStaff={isAdminOrStaff} />
                  <HeaderAccountMenu isAdminOrStaff={isAdminOrStaff} />
                </>
              ) : mounted ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-500 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-95"
                  >
                    Đăng ký
                  </Link>
                </div>
              ) : (
                <div className="hidden md:block w-20 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
              )}

              {/* Mobile hamburger button */}
              <button
                type="button"
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <HeaderMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAdminOrStaff={isAdminOrStaff}
        mounted={mounted}
      />
    </>
  );
}
