"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeMap: Record<string, string> = {
  services: "Dịch vụ",
  bookings: "Lịch đặt",
  profile: "Trang cá nhân",
  chat: "Tin nhắn",
  favorites: "Yêu thích",
  notifications: "Thông báo",
  privacy: "Chính sách bảo mật",
  terms: "Điều khoản sử dụng",
  providers: "Nhà cung cấp",
  create: "Tạo lịch đặt",
  review: "Đánh giá",
  dispute: "Khiếu nại",
  track: "Theo dõi",
  addresses: "Địa chỉ",
  compare: "So sánh",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav
      className="flex px-4 py-3 bg-white/5 backdrop-blur-sm rounded-[16px] max-w-7xl mx-auto border border-white/10"
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-xs font-semibold text-slate-500">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-cyan-300 transition-colors gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </li>
        {isHome ? (
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1 shrink-0" />
            <span className="text-cyan-400 font-bold">
              Tìm kiếm thợ tại nhà
            </span>
          </li>
        ) : (
          paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join("/")}`;
            const isLast = index === paths.length - 1;
            const label = routeMap[path] || decodeURIComponent(path);

            return (
              <li key={path} className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-1 shrink-0" />
                {isLast ? (
                  <span className="text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-none">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    prefetch={false}
                    className="text-slate-400 hover:text-cyan-300 transition-colors truncate max-w-[150px] sm:max-w-none"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })
        )}
      </ol>
    </nav>
  );
}
