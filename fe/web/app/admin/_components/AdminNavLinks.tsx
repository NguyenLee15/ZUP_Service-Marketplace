"use client";

import React from "react";
import Link from "next/link";
import { NavItem } from "./admin-nav-config";

interface AdminNavLinksProps {
  navItems: NavItem[];
  pathname: string;
  showLabel: boolean;
  onItemClick?: () => void;
}

export function AdminNavLinks({
  navItems,
  pathname,
  showLabel,
  onItemClick,
}: AdminNavLinksProps) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            title={!showLabel ? item.label : undefined}
            aria-label={item.label}
            onClick={onItemClick}
            className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 group active:scale-[0.99] ${
              isActive
                ? "bg-slate-800 text-white font-semibold ring-1 ring-slate-700 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-1 before:rounded-r-full before:bg-emerald-400"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div
              className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
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
}

