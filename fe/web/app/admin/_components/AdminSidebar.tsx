"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavItem } from "./admin-nav-config";
import { AdminNavLinks } from "./AdminNavLinks";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAdmin: boolean;
  navItems: NavItem[];
  pathname: string;
  onLogout: () => void;
}

export function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  isAdmin,
  navItems,
  pathname,
  onLogout,
}: AdminSidebarProps) {
  return (
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
                ZUP Admin
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

      <AdminNavLinks
        navItems={navItems}
        pathname={pathname}
        showLabel={sidebarOpen}
      />

      <div className="border-t border-slate-800 p-4 shrink-0">
        <Button
          variant="ghost"
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="w-full justify-start gap-3 rounded-md border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95 transition-all px-3 py-2.5 h-auto text-sm font-medium"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Đăng xuất</span>}
        </Button>
      </div>
    </aside>
  );
}

