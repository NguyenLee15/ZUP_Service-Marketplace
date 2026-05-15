'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Package, MessageSquare, User, Bell, Menu, X, LogOut, ChevronDown, Heart } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';
import { authApi } from '@/features/auth/services/auth.api';
import { notificationsApi } from '@/features/auth/services/api';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function CustomerHeader() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

    if (!user) {
      authApi.getProfile()
        .then((res) => {
          if (!cancelled) setUser(res.data.data);
        })
        .catch((err: any) => {
          if (err?.response?.status === 401 || err?.status === 401) {
            handleUnauthorized();
          }
        });
    }

    notificationsApi.getUnreadCount()
      .then((res) => {
        if (!cancelled) setUnreadCount(Number(res.data.data?.count || 0));
      })
      .catch((err: any) => {
        if (err?.response?.status === 401 || err?.status === 401) {
          handleUnauthorized();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mounted, router, setUser, storeLogout, user]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNotificationReceived = useCallback((data: any) => {
    setUnreadCount((prev) => prev + 1);
    toast.info('Thông báo mới', {
      description: data?.title || data?.content || 'Bạn vừa có một cập nhật mới từ hệ thống.',
      duration: 5000,
      action: {
        label: 'Xem',
        onClick: () => router.push('/notifications'),
      },
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
        className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow,padding] duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-2xl border-b border-platinum-tint shadow-[var(--brand-shadow-sm)] py-2'
            : 'bg-white/95 backdrop-blur-md border-b border-platinum-tint py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-4 h-16">
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-action-blue flex items-center justify-center text-white font-bold text-xl shadow-[var(--brand-shadow-button)] group-hover:scale-105 transition-transform duration-300">
                  H
                </div>
                <span className="font-bold text-2xl text-midnight-indigo tracking-tight hidden md:block">
                  Home<span className="text-action-blue">Service</span>
                </span>
              </Link>
            </div>

            <div className={`flex-1 max-w-2xl px-2 transition-[opacity,transform] duration-300 ${
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
                  className="w-full bg-cloud-mist border border-platinum-tint hover:border-steel-gray focus:bg-card focus:border-action-blue focus:ring-4 focus:ring-action-blue/10 rounded-full py-2.5 pl-5 pr-14 outline-none focus-visible:ring-2 focus-visible:ring-action-blue transition-colors duration-300 text-sm md:text-base text-foreground"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="p-2 bg-action-blue text-white hover:bg-glacier-blue rounded-full shadow-sm hover:shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {mounted && isAuthenticated() ? (
                <>
                  <Link href="/bookings" aria-label="Đơn hàng" className="hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Package className="w-5 h-5" />
                  </Link>
                  <Link href="/chat" aria-label="Tin nhắn" className="hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link href="/favorites" aria-label="Dịch vụ yêu thích" className="relative hidden sm:flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Heart className="w-5 h-5" />
                    {favorites.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-white">
                        {favorites.length > 9 ? '9+' : favorites.length}
                      </span>
                    )}
                  </Link>
                  <Link href="/notifications" aria-label="Thông báo" className="relative flex flex-col items-center justify-center text-muted-foreground hover:text-action-blue hover:bg-pale-gray w-10 h-10 rounded-xl transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Mở menu tài khoản"
                        className="hidden lg:flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-platinum-tint bg-white/90 hover:bg-pale-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-action-blue text-white text-sm font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-28 xl:max-w-36 truncate text-sm font-medium text-foreground">
                          {displayName}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Đang đăng nhập</p>
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        {user?.email && user?.fullName && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="w-4 h-4" />
                          Hồ sơ
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleLogout}
                        className="cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : mounted ? (
                <div className="flex items-center gap-2">
                  <Link href="/register">
                    <Button variant="outline" className="border-action-blue text-action-blue hover:bg-pale-gray rounded-lg px-4 h-9 text-sm transition-colors">
                      Đăng ký
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="default" className="bg-action-blue hover:bg-glacier-blue text-white rounded-lg px-4 h-9 text-sm shadow-[var(--brand-shadow-button)] transition-colors">
                      Đăng nhập
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="w-20 h-9 bg-pale-gray animate-pulse rounded-full" />
              )}

              <button
                type="button"
                className="md:hidden p-2 text-muted-foreground hover:bg-pale-gray rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
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
            className="absolute top-[80px] left-0 right-0 bg-card border-b border-platinum-tint px-4 py-4 space-y-2 shadow-[var(--brand-shadow-card)] animate-in slide-in-from-top-4"
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
