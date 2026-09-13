'use client';

import Link from 'next/link';
import { Package, MessageSquare, Heart, Bell, LayoutDashboard } from 'lucide-react';
import { useServiceStore } from '@/store/service.store';
import { useNotificationStore } from '@/store/notification.store';

interface HeaderUserActionsProps {
  isAdminOrStaff: boolean;
}

export function HeaderUserActions({ isAdminOrStaff }: HeaderUserActionsProps) {
  const { favorites } = useServiceStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
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
    </>
  );
}

