'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Package,
  MessageSquare,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Heart,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';
import { useNotificationStore } from '@/store/notification.store';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';
import { Role } from '@/types';

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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, isAuthenticated, logout: storeLogout, setUser } = useAuthStore();
  const { favorites } = useServiceStore();
  const router = useRouter();
  const pathname = usePathname();
  const isServicesPage = pathname === '/services';
  const isAdminOrStaff = user?.role === Role.ADMIN || user?.role === Role.STAFF;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
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

  useEffect(() => {
    if (!mobileMenuOpen && !accountMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accountMenuOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [accountMenuOpen]);

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

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (keyword.trim()) {
      router.push(
        `/services?keyword=${encodeURIComponent(keyword.trim())}${
          aiMode ? '&ai=true' : ''
        }`
      );
      return;
    }
    router.push('/services');
  };

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/features/auth/services/auth.api');
      await authApi.logout();
    } catch {}
    storeLogout();
    router.push('/login');
  };

  const displayName = user?.fullName?.trim() || user?.email || 'Tài khoản';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-200 border-b ${
          scrolled
            ? 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 shadow-sm'
            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800/60'
        } backdrop-blur-md`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 sm:gap-4 h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/"
                prefetch={false}
                className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl active:scale-95 transition-transform duration-200"
                aria-label="Về trang chủ ZUP"
              >
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-sm shadow-sky-600/20 group-hover:bg-sky-500 transition-colors">
                  Z
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                    ZUP
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                    Dịch vụ gia đình
                  </span>
                </div>
              </Link>
            </div>

            {/* Omni-Search Capsule */}
            {!isServicesPage && (
              <div className="hidden sm:block flex-1 max-w-xl px-2">
                <form
                  onSubmit={handleSearch}
                  role="search"
                  id="header-search-form"
                  className="relative group"
                >
                  <div className="relative flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-200">
                    <Search className="w-4 h-4 ml-3.5 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" />
                    <input
                      type="text"
                      name="search"
                      aria-label="Tìm kiếm dịch vụ trên ZUP"
                      autoComplete="off"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Tìm thợ sửa chữa, vệ sinh, lắp đặt…"
                      className="w-full bg-transparent py-2 pl-2.5 pr-20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAiMode(!aiMode)}
                        title={aiMode ? 'Đang bật AI Search' : 'Bật AI Search'}
                        className={`p-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer ${
                          aiMode
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="submit"
                        aria-label="Tìm kiếm"
                        className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Actions & Profile */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {mounted && isAuthenticated() ? (
                <>
                  {isAdminOrStaff && (
                    <Link
                      href="/admin/dashboard"
                      prefetch={false}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                      <span>Quản trị</span>
                    </Link>
                  )}

                  <Link
                    href="/bookings"
                    prefetch={false}
                    aria-label="Đơn dịch vụ"
                    className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    title="Đơn đặt dịch vụ"
                  >
                    <Package className="w-4.5 h-4.5" />
                  </Link>

                  <Link
                    href="/chat"
                    prefetch={false}
                    aria-label="Tin nhắn"
                    className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    title="Tin nhắn"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                  </Link>

                  <Link
                    href="/favorites"
                    prefetch={false}
                    aria-label="Dịch vụ yêu thích"
                    className="relative hidden sm:flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    title="Yêu thích"
                  >
                    <Heart className="w-4.5 h-4.5" />
                    {favorites.length > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-[9px] font-bold text-white rounded-full">
                        {favorites.length > 9 ? '9+' : favorites.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/notifications"
                    prefetch={false}
                    aria-label="Thông báo"
                    className="relative flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    title="Thông báo"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-[9px] font-bold text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile Dropdown */}
                  <div ref={accountMenuRef} className="relative hidden lg:block">
                    <button
                      type="button"
                      aria-label="Menu tài khoản"
                      aria-haspopup="menu"
                      aria-expanded={accountMenuOpen}
                      onClick={() => setAccountMenuOpen((open) => !open)}
                      className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                        {userInitial}
                      </span>
                      <span className="max-w-28 xl:max-w-36 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {displayName}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          accountMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {accountMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
                      >
                        <div className="space-y-0.5 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Tài khoản ZUP
                          </p>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {displayName}
                          </p>
                          {user?.email && user?.fullName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                        {isAdminOrStaff && (
                          <>
                            <Link
                              href="/admin/dashboard"
                              prefetch={false}
                              role="menuitem"
                              onClick={() => setAccountMenuOpen(false)}
                              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              Trang quản trị (Admin)
                            </Link>
                            <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                          </>
                        )}
                        <Link
                          href="/profile"
                          prefetch={false}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Hồ sơ cá nhân
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void handleLogout();
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
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

              {/* Mobile menu button */}
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

      {/* Mobile navigation sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs">
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="customer-mobile-menu"
            className="relative z-10 top-16 left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 pb-8 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-150"
          >
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
            >
              <Search className="w-4 h-4 text-slate-400" /> Tìm dịch vụ
            </Link>
            {mounted && isAuthenticated() ? (
              <>
                {isAdminOrStaff && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-semibold border border-sky-200 dark:border-sky-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-sky-600" /> Vào trang quản trị
                  </Link>
                )}
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  <Package className="w-4 h-4 text-slate-400" /> Đơn dịch vụ của tôi
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Tin nhắn
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-slate-400" /> Yêu thích
                  </span>
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {favorites.length > 9 ? '9+' : favorites.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  <span className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" /> Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : mounted ? (
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-xs"
                >
                  Đăng ký tài khoản ZUP
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
