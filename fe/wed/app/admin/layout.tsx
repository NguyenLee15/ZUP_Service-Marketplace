'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  WalletCards,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { label: 'Ví', href: '/admin/wallet', icon: <WalletCards className="w-5 h-5" /> },
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
  const { logout: clearStore, user } = useAuthStore();

  return (
    <>
    <div className="admin-shell themed-shell flex h-screen text-slate-900 font-sans">
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-800 bg-[var(--admin-sidebar)] text-slate-200 transition-[width] duration-300 flex flex-col shadow-[8px_0_28px_rgba(15,23,42,0.16)] ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-700 shadow-sm shrink-0 flex items-center justify-center bg-slate-950">
                <Image
                  src="/logo.png"
                  alt="ZUP Logo Admin Sidebar - Hệ thống quản trị dịch vụ"
                  width={32}
                  height={32}
                  className="h-full w-full scale-[1.38] object-cover"
                />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-[0.08em] text-white uppercase leading-none">
                  Zup Admin
                </h1>
                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 leading-none">
                  Hệ thống quản trị
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-700 mx-auto shadow-sm flex items-center justify-center bg-slate-950">
              <Image
                src="/logo.png"
                alt="ZUP Logo Admin Icon - Biểu trưng quản trị ZUP"
                width={32}
                height={32}
                className="h-full w-full scale-[1.38] object-cover"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Thu gọn' : 'Mở rộng'}
            title={sidebarOpen ? 'Thu gọn' : 'Mở rộng'}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                aria-label={item.label}
              className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 group active:scale-[0.99] ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold ring-1 ring-slate-700 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:rounded-r-full before:bg-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4 shrink-0">
          <Button
            variant="ghost"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="w-full justify-start gap-3 rounded-md border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95 transition-all px-3 py-2.5 h-auto text-sm font-medium"
            onClick={async () => {
              try { await authApi.logout(); } catch {}
              clearStore();
              router.push('/login');
            }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      <main className={`flex-grow overflow-auto transition-[margin-left] duration-300 flex flex-col h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-white/92 px-6 py-3 backdrop-blur-md shrink-0 xl:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <h2 className="hidden text-lg font-bold tracking-tight text-slate-900 xl:block">
                {navItems.find(item => pathname.startsWith(item.href))?.label || 'Quản trị hệ thống'}
              </h2>
              <div className="relative hidden w-80 md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  placeholder="Tìm kiếm giao dịch, người dùng..."
                  className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-700 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'ADMIN'}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 shadow-sm font-black text-white">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-[var(--admin-canvas)] p-5 xl:p-6">
          {children}
        </div>
      </main>
    </div>
    <Toaster position="bottom-right" richColors />
    </>
  );
}
