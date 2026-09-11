"use client";

import React from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { User } from "@/types";

interface AdminHeaderProps {
  onOpenMobileDrawer: () => void;
  unreadCount: number;
  user: User | null;
  isAdmin: boolean;
}

export function AdminHeader({
  onOpenMobileDrawer,
  unreadCount,
  user,
  isAdmin,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-white/92 px-4 sm:px-6 py-3 backdrop-blur-md shrink-0 xl:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            onClick={onOpenMobileDrawer}
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
  );
}

