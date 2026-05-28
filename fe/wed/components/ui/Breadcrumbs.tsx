'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  services: 'Dịch vụ',
  bookings: 'Lịch đặt',
  profile: 'Trang cá nhân',
  chat: 'Tin nhắn',
  favorites: 'Yêu thích',
  notifications: 'Thông báo',
  privacy: 'Chính sách bảo mật',
  terms: 'Điều khoản sử dụng',
  providers: 'Nhà cung cấp',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-sm font-medium text-slate-500">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-action-blue transition-colors gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
        </li>
        {paths.map((path, index) => {
          const href = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          const label = routeMap[path] || decodeURIComponent(path);

          return (
            <li key={path} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />
              {isLast ? (
                <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-slate-400 hover:text-action-blue transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
