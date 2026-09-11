"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/features/auth/services/auth.api";
import { notificationsApi } from "@/features/auth/services/api";
import { useNotificationsSocket } from "@/features/notification/hooks/useNotificationsSocket";
import { Role } from "@/types";
import { ALL_NAV_ITEMS, NavItem } from "./admin-nav-config";

export function useAdminLayoutFlow() {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout: clearStore, user, _hasHydrated } = useAuthStore();

  const isStaff = user?.role === Role.STAFF;
  const isAdmin = user?.role === Role.ADMIN;
  const isAuthorized = isAdmin || isStaff;

  // 1. Auth check
  useEffect(() => {
    if (_hasHydrated) {
      if (!user || (!isAdmin && !isStaff)) {
        router.replace("/login");
      }
    }
  }, [user, _hasHydrated, isAdmin, isStaff, router]);

  // 2. Refresh Profile
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

  // 3. Menu items according to permissions
  const navItems = useMemo<NavItem[]>(() => {
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

  // 4. Dynamic default landing
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

  // 6. Mobile drawer UX
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

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    clearStore();
    router.push("/login");
  }, [clearStore, router]);

  return {
    pathname,
    user,
    isAdmin,
    isStaff,
    isAuthorized,
    _hasHydrated,
    navItems,
    sidebarOpen,
    setSidebarOpen,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    unreadCount,
    handleLogout,
  };
}

