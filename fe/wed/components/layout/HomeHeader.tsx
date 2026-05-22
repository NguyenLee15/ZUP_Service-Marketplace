import Link from 'next/link';
import { Menu } from 'lucide-react';

import { HeaderSearchBar } from '@/components/layout/HeaderSearchBar';
import { HomeHeaderAuth } from '@/components/layout/HomeHeaderAuth';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-platinum-tint bg-white/95 py-2 backdrop-blur-md">
      <div className="mobile-header-width mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-action-blue text-lg font-bold text-white shadow-[var(--brand-shadow-button)] sm:h-10 sm:w-10 sm:text-xl">
              H
            </div>
            <span className="hidden text-2xl font-bold tracking-normal text-midnight-indigo md:block">
              Home<span className="text-action-blue">Service</span>
            </span>
          </Link>

          {/* Search bar: ẩn trên mobile, slide-in khi cuộn qua Hero */}
          <div className="hidden sm:block flex-1 min-w-0">
            <HeaderSearchBar />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <HomeHeaderAuth />

            <details className="group relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue [&::-webkit-details-marker]:hidden">
                <Menu className="h-6 w-6 group-open:hidden" />
                <span className="hidden h-6 w-6 items-center justify-center text-xl font-semibold group-open:flex">×</span>
                <span className="sr-only">Mở menu</span>
              </summary>
              <nav className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-platinum-tint bg-card p-2 shadow-[var(--brand-shadow-card)]">
                <Link href="/services" className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Tìm dịch vụ
                </Link>
                <Link href="/bookings" className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Đơn hàng của tôi
                </Link>
                <Link href="/notifications" className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Thông báo
                </Link>
                <Link href="/profile" className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Tài khoản
                </Link>
                <div className="my-1 h-px bg-platinum-tint" />
                <Link href="/login" className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Đăng nhập
                </Link>
                <Link href="/register" className="block rounded-lg px-4 py-3 text-sm font-bold text-action-blue hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                  Đăng ký tài khoản
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
