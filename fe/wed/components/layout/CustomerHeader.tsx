'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Package, MessageSquare, User, Bell, Menu, X, LogOut, ChevronDown, Heart, Wrench } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';

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
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, isAuthenticated, logout: storeLogout, setUser } = useAuthStore();
  const { favorites } = useServiceStore();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      setUnreadCount(0);
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
        authApi.getProfile()
          .then((res) => {
            if (!cancelled) setUser(res.data.data);
          })
          .catch((err: unknown) => {
            if (isUnauthorizedError(err)) {
              handleUnauthorized();
            }
          });
      }

      notificationsApi.getUnreadCount()
        .then((res) => {
          if (!cancelled) setUnreadCount(Number(res.data.data?.count || 0));
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

  const handleNotificationReceived = useCallback((data: NotificationPayload) => {
    setUnreadCount((prev) => prev + 1);
    void import('sonner').then(({ toast }) => {
      toast.info('Thông báo mới', {
        description: data?.title || data?.content || 'Bạn vừa có một cập nhật mới từ hệ thống.',
        duration: 5000,
        action: {
          label: 'Xem',
          onClick: () => router.push('/notifications'),
        },
      });
    });
  }, [router]);

  useNotificationsSocket(handleNotificationReceived);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (keyword.trim()) {
      router.push(`/services?keyword=${encodeURIComponent(keyword.trim())}`);
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
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/40 dark:border-slate-800/40 shadow-lg shadow-sky-600/5 dark:shadow-sky-950/20 py-2.5 sm:py-3.5'
            : 'bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/20 dark:border-slate-800/20 py-3.5 sm:py-4.5'
        } backdrop-blur-xl`}
      >
        <div className="mobile-header-width mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 sm:gap-4 h-14 sm:h-16">
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/" prefetch={false} className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue rounded-xl active:scale-95 transition-transform duration-200">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 dark:shadow-sky-950/40 group-hover:scale-105 transition-transform duration-300">
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="font-sans text-[22px] sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white hidden md:block">
                  Home<span className="text-sky-600 dark:text-sky-400">Serve</span>
                </span>
              </Link>
            </div>

            <div className={`hidden min-w-0 flex-1 max-w-2xl px-1 pr-12 transition-[opacity,transform] duration-300 sm:block sm:px-2 sm:pr-12 md:pr-0 ${
              isHomePage && !scrolled 
                ? 'opacity-0 pointer-events-none -translate-y-2' 
                : 'opacity-100 translate-y-0'
            }`}>
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  name="search"
                  aria-label="Tìm kiếm dịch vụ"
                  autoComplete="off"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Hôm nay bạn cần giúp gì?…"
                  className="w-full bg-cloud-mist border border-platinum-tint hover:border-steel-gray focus:bg-card focus:border-action-blue focus:ring-4 focus:ring-action-blue/10 rounded-full py-1.5 sm:py-2.5 pl-4 sm:pl-5 pr-10 sm:pr-14 outline-none focus-visible:ring-2 focus-visible:ring-action-blue transition-colors duration-300 text-xs sm:text-sm md:text-base text-foreground"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="p-1.5 sm:p-2 bg-action-blue text-white hover:bg-glacier-blue rounded-full shadow-sm hover:shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {mounted && isAuthenticated() ? (
                <>
                  <Link href="/bookings" prefetch={false} aria-label="Đơn hàng" className="hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Package className="w-5 h-5" />
                  </Link>
                  <Link href="/chat" prefetch={false} aria-label="Tin nhắn" className="hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link href="/favorites" prefetch={false} aria-label="Dịch vụ yêu thích" className="relative hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Heart className="w-5 h-5" />
                    {favorites.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-white">
                        {favorites.length > 9 ? '9+' : favorites.length}
                      </span>
                    )}
                  </Link>
                  <Link href="/notifications" prefetch={false} aria-label="Thông báo" className="relative flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div ref={accountMenuRef} className="relative hidden lg:block">
                    <button
                      type="button"
                      aria-label="Mở menu tài khoản"
                      aria-haspopup="menu"
                      aria-expanded={accountMenuOpen}
                      onClick={() => setAccountMenuOpen((open) => !open)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-platinum-tint bg-white/90 hover:bg-pale-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-action-blue text-sm font-semibold text-white">
                        {userInitial}
                      </span>
                      <span className="max-w-28 xl:max-w-36 truncate text-sm font-medium text-foreground">
                        {displayName}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {accountMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border border-platinum-tint bg-white p-1.5 shadow-[var(--brand-shadow-card)]"
                      >
                        <div className="space-y-1 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Đang đăng nhập</p>
                          <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                          {user?.email && user?.fullName && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          )}
                        </div>
                        <div className="my-1 h-px bg-platinum-tint" />
                        <Link
                          href="/profile"
                          prefetch={false}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                        >
                          <User className="w-4 h-4" />
                          Hồ sơ
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void handleLogout();
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : mounted ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/register"
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-action-blue px-4 text-sm font-medium text-action-blue transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    Đăng ký
                  </Link>
                  <Link
                    href="/login"
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-action-blue px-4 text-sm font-medium text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    Đăng nhập
                  </Link>
                </div>
              ) : (
                <div className="hidden md:block w-20 h-9 bg-pale-gray animate-pulse rounded-full" />
              )}

              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 md:static md:hidden md:translate-y-0 p-2 text-muted-foreground hover:bg-pale-gray rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="customer-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-midnight-indigo/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            id="customer-mobile-menu"
            className="absolute top-[72px] left-0 right-0 max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain bg-card border-b border-platinum-tint px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2 shadow-[var(--brand-shadow-card)] animate-in slide-in-from-top-4"
            onClick={(event) => event.stopPropagation()}
          >
            <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
              <Search className="w-5 h-5" /> Tìm dịch vụ
            </Link>
            {mounted && isAuthenticated() ? (
              <>
                <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <Package className="w-5 h-5" /> Đơn hàng của tôi
                </Link>
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <MessageSquare className="w-5 h-5" /> Tin nhắn
                </Link>
                <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <span className="flex items-center gap-3">
                    <Heart className="w-5 h-5" /> Yêu thích
                  </span>
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {favorites.length > 9 ? '9+' : favorites.length}
                    </span>
                  )}
                </Link>
                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <span className="flex items-center gap-3">
                    <Bell className="w-5 h-5" /> Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <User className="w-5 h-5" /> Tài khoản
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              </>
            ) : mounted ? (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-pale-gray rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  <User className="w-5 h-5" /> Đăng nhập
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-action-blue hover:bg-pale-gray rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Đăng ký tài khoản
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}


    </>
  );
}
