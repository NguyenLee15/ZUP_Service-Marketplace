"use client";

import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAdminLayoutFlow } from "./_components/useAdminLayoutFlow";
import { AdminMobileDrawer } from "./_components/AdminMobileDrawer";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminHeader } from "./_components/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    sidebarOpen,
    setSidebarOpen,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    unreadCount,
    user,
    isAdmin,
    isAuthorized,
    _hasHydrated,
    navItems,
    pathname,
    handleLogout,
  } = useAdminLayoutFlow();

  if (!_hasHydrated || !user || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--admin-canvas)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-[var(--admin-canvas)] text-slate-800">
        <AdminMobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          isAdmin={isAdmin}
          navItems={navItems}
          pathname={pathname}
          onLogout={handleLogout}
        />

        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isAdmin={isAdmin}
          navItems={navItems}
          pathname={pathname}
          onLogout={handleLogout}
        />

        <main
          className={`flex-grow overflow-auto transition-[margin-left] duration-300 flex flex-col h-screen ${
            sidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <AdminHeader
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
            unreadCount={unreadCount}
            user={user}
            isAdmin={isAdmin}
          />

          <div className="flex-1 bg-[var(--admin-canvas)] p-4 sm:p-5 xl:p-6 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
