'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Package, MessageSquare, Heart, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';
import { useNotificationStore } from '@/store/notification.store';

interface HeaderMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminOrStaff: boolean;
  mounted: boolean;
}

export function HeaderMobileDrawer({
  isOpen,
  onClose,
  isAdminOrStaff,
  mounted,
}: HeaderMobileDrawerProps) {
  const { isAuthenticated, logout: storeLogout } = useAuthStore();
  const { favorites } = useServiceStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/features/auth/services/auth.api');
      await authApi.logout();
    } catch {}
    storeLogout();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="Đóng menu di động"
        onClick={onClose}
      />
      <div
        id="customer-mobile-menu"
        className="relative z-10 top-16 left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 pb-8 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-150"
      >
        <Link
          href="/services"
          onClick={onClose}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
        >
          <Search className="w-4 h-4 text-slate-400" /> Tìm dịch vụ
        </Link>

        {mounted && isAuthenticated() ? (
          <>
            {isAdminOrStaff && (
              <Link
                href="/admin/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-semibold border border-sky-200 dark:border-sky-800"
              >
                <LayoutDashboard className="w-4 h-4 text-sky-600" /> Vào trang quản trị
              </Link>
            )}
            <Link
              href="/bookings"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
            >
              <Package className="w-4 h-4 text-slate-400" /> Đơn dịch vụ của tôi
            </Link>
            <Link
              href="/chat"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" /> Tin nhắn
            </Link>
            <Link
              href="/favorites"
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium"
            >
              <User className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
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
              onClick={onClose}
              className="flex items-center justify-center h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex items-center justify-center h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-xs"
            >
              Đăng ký tài khoản ZUP
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

