"use client";

import React from "react";
import Image from "next/image";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavItem } from "./admin-nav-config";
import { AdminNavLinks } from "./AdminNavLinks";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  navItems: NavItem[];
  pathname: string;
  onLogout: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  isAdmin,
  navItems,
  pathname,
  onLogout,
}: AdminMobileDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-800 bg-[var(--admin-sidebar)] text-slate-200 flex flex-col shadow-2xl transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
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
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdminNavLinks
          navItems={navItems}
          pathname={pathname}
          showLabel={true}
          onItemClick={onClose}
        />

        <div className="border-t border-slate-800 p-4 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-md border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2.5 h-auto text-sm font-medium"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>
    </>
  );
}

