'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Users,
  CheckSquare,
  Users2,
  MessageSquare,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/features/auth/services/auth.api';
import { Toaster } from '@/components/ui/sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Đơn hàng', href: '/admin/bookings', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Dịch vụ', href: '/admin/services', icon: <Package className="w-5 h-5" /> },
  { label: 'Người dùng', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Tranh chấp', href: '/admin/disputes', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'KYC', href: '/admin/kyc', icon: <CheckSquare className="w-5 h-5" /> },
  { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className="w-5 h-5" /> },
  { label: 'Nhân viên', href: '/admin/staffs', icon: <Users2 className="w-5 h-5" /> },
  { label: 'Cài đặt', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const { logout: clearStore, user } = useAuthStore();

  return (
    <>
    <div className="themed-shell flex h-screen bg-background text-foreground">
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-border bg-card shadow-[var(--brand-shadow-sm)] transition-[width] duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {sidebarOpen && <h1 className="text-lg font-semibold text-action-blue">Bảng quản trị</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
            title={sidebarOpen ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                aria-label={item.label}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? 'bg-blue-50/80 text-action-blue shadow-sm dark:bg-blue-950/40 dark:text-blue-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="w-full justify-start gap-2 rounded-lg transition-colors"
            onClick={async () => {
              try { await authApi.logout(); } catch {}
              clearStore();
              router.push('/login');
            }}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      <main className={`flex-1 overflow-auto transition-[margin-left] duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Quản trị hệ thống</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={resolvedTheme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                title="Đổi giao diện"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'Tài khoản quản trị'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-action-blue font-semibold text-white shadow-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 bg-background">
          {children}
        </div>
      </main>
    </div>
    <Toaster position="bottom-right" richColors />
    </>
  );
}
