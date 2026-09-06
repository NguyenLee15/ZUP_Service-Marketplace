"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  ScrollText,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/features/auth/services/auth.api";
import { notificationsApi } from "@/features/auth/services/api";
import { useNotificationsSocket } from "@/features/notification/hooks/useNotificationsSocket";
import { Toaster } from "@/components/ui/sonner";
import { Role } from "@/types";
import {
  AdminPermission,
  AdminPermissionValue,
} from "@/types/admin-permissions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredPermissions?: AdminPermissionValue[];
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.FINANCE_REVENUE],
  },
  {
    label: "Đơn hàng",
    href: "/admin/bookings",
    icon: <BookOpen className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.BOOKING_VIEW],
  },
  {
    label: "Dịch vụ",
    href: "/admin/services",
    icon: <Package className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.SERVICE_MODERATE],
  },
  {
    label: "Ví",
    href: "/admin/wallet",
    icon: <WalletCards className="w-5 h-5" />,
    requiredPermissions: [
      AdminPermission.WALLET_DEPOSIT_MANAGE,
      AdminPermission.WALLET_WITHDRAWAL_MANAGE,
    ],
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.USER_VIEW],
  },
  {
    label: "Tranh chấp",
    href: "/admin/disputes",
    icon: <MessageSquare className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.DISPUTE_VIEW],
  },
  {
    label: "KYC",
    href: "/admin/kyc",
    icon: <CheckSquare className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.KYC_VIEW],
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: <FolderOpen className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.SERVICE_MODERATE],
  },
  {
    label: "Nhân viên",
    href: "/admin/staffs",
    icon: <Users2 className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [AdminPermission.STAFF_VIEW],
  },
  {
    label: "Audit logs",
    href: "/admin/audit-logs",
    icon: <ScrollText className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [AdminPermission.AUDIT_LOG_VIEW],
  },
  {
    label: "Cài đặt",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [
      AdminPermission.SETTINGS_MANAGE,
      AdminPermission.FINANCE_COMMISSION,
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout: clearStore, user, _hasHydrated } = useAuthStore();

  const isStaff = user?.role === Role.STAFF;
  const isAdmin = user?.role === Role.ADMIN;
  const isAuthorized = isAdmin || isStaff;

  // 1. Auth check: Cho phép cả ADMIN và STAFF truy cập Admin Portal
  useEffect(() => {
    if (_hasHydrated) {
      if (!user || (!isAdmin && !isStaff)) {
        router.replace("/login");
      }
    }
  }, [user, _hasHydrated, isAdmin, isStaff, router]);

  // 2. Refresh Profile khi vào Admin để chống stale permissions từ localStorage
  useEffect(() => {
    if (_hasHydrated && isAuthorized) {
      authApi
        .getProfile()
        .then((res) => {
          if (res.data?.data) {
            useAuthStore.getState().setUser(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [_hasHydrated, isAuthorized]);

  // 3. Lọc danh sách menu theo vai trò và permissions
  const navItems = useMemo(() => {
    if (!user) return [];
    if (user.role === Role.ADMIN) return ALL_NAV_ITEMS;

    const userPermissions = (user.permissions as string[]) || [];

    return ALL_NAV_ITEMS.filter((item) => {
      if (item.adminOnly) return false;
      if (!item.requiredPermissions || item.requiredPermissions.length === 0)
        return true;
      return item.requiredPermissions.some((p) =>
        userPermissions.includes(p),
      );
    });
  }, [user]);

  // 4. Dynamic default landing: nếu Staff truy cập /admin hoặc /admin/dashboard mà không có quyền
  useEffect(() => {
    if (!_hasHydrated || !isAuthorized || navItems.length === 0) return;

    if (pathname === "/admin" || pathname === "/admin/") {
      router.replace(navItems[0]?.href || "/admin/bookings");
      return;
    }

    if (
      isStaff &&
      pathname.startsWith("/admin/dashboard") &&
      !navItems.some((item) => item.href === "/admin/dashboard")
    ) {
      router.replace(navItems[0]?.href || "/admin/bookings");
    }
  }, [_hasHydrated, isAuthorized, pathname, isStaff, navItems, router]);

  // 5. Notifications count & WebSocket
  useEffect(() => {
    if (_hasHydrated && isAuthorized) {
      notificationsApi
        .getUnreadCount()
        .then((res) => setUnreadCount(Number(res.data.data?.count || 0)))
        .catch(() => {});
    }
  }, [_hasHydrated, isAuthorized]);

  const handleNotificationReceived = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  useNotificationsSocket(handleNotificationReceived);

  // 6. Mobile drawer UX: đóng khi chuyển route, phím ESC, và lock scroll
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  if (!_hasHydrated || !user || !isAuthorized) {
    return null;
  }

  const renderNavLinks = (isDrawer = false) => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const showLabel = isDrawer || sidebarOpen;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={!showLabel ? item.label : undefined}
            aria-label={item.label}
            onClick={() => isDrawer && setMobileDrawerOpen(false)}
            className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 group active:scale-[0.99] ${
              isActive
                ? "bg-slate-800 text-white font-semibold ring-1 ring-slate-700 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:rounded-r-full before:bg-emerald-400"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div
              className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-white"
              }`}
            >
              {item.icon}
            </div>
            {showLabel && <span className="text-sm">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="admin-shell themed-shell flex h-screen text-slate-900 font-sans overflow-hidden">
        {/* Mobile Backdrop Overlay */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-800 bg-[var(--admin-sidebar)] text-slate-200 flex flex-col shadow-2xl transition-transform duration-300 md:hidden ${
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-700 shadow-sm shrink-0 flex items-center justify-center bg-slate-950">
                <Image
                  src="/logo.png"
                  alt="ZUP Logo Admin Sidebar"
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
                  {isAdmin ? "Quản trị hệ thống" : "Nhân viên điều phối"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Đóng menu"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {renderNavLinks(true)}

          <div className="border-t border-slate-800 p-4 shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-md border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 h-auto text-sm font-medium"
              onClick={async () => {
                try {
                  await authApi.logout();
                } catch {}
                clearStore();
                router.push("/login");
              }}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </aside>

        {/* Desktop Fixed Sidebar */}
        <aside
          className={`hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-slate-800 bg-[var(--admin-sidebar)] text-slate-200 transition-[width] duration-300 flex-col shadow-[8px_0_28px_rgba(15,23,42,0.16)] ${
            sidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 shrink-0">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-700 shadow-sm shrink-0 flex items-center justify-center bg-slate-950">
                  <Image
                    src="/logo.png"
                    alt="ZUP Logo Admin Sidebar"
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
                    {isAdmin ? "Quản trị hệ thống" : "Nhân viên điều phối"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 overflow-hidden rounded-lg border border-slate-700 mx-auto shadow-sm flex items-center justify-center bg-slate-950">
                <Image
                  src="/logo.png"
                  alt="ZUP Logo Admin Icon"
                  width={32}
                  height={32}
                  className="h-full w-full scale-[1.38] object-cover"
                />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Thu gọn" : "Mở rộng"}
              title={sidebarOpen ? "Thu gọn" : "Mở rộng"}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {renderNavLinks(false)}

          <div className="border-t border-slate-800 p-4 shrink-0">
            <Button
              variant="ghost"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="w-full justify-start gap-3 rounded-md border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95 transition-all px-3 py-2.5 h-auto text-sm font-medium"
              onClick={async () => {
                try {
                  await authApi.logout();
                } catch {}
                clearStore();
                router.push("/login");
              }}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Đăng xuất</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className={`flex-grow overflow-auto transition-[margin-left] duration-300 flex flex-col h-screen ${
            sidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-white/92 px-4 sm:px-6 py-3 backdrop-blur-md shrink-0 xl:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Mở menu quản trị"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 md:hidden">
                  Admin Portal
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/admin/notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.fullName || "Quản trị viên"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isAdmin ? "QUẢN TRỊ VIÊN" : "NHÂN VIÊN ĐIỀU PHỐI"}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 shadow-sm font-black text-white">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 bg-[var(--admin-canvas)] p-4 sm:p-5 xl:p-6 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
