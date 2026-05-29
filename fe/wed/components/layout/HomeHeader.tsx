import Link from 'next/link';
import Image from 'next/image';
import { Menu, Wrench } from 'lucide-react';

import { HeaderSearchBar } from '@/components/layout/HeaderSearchBar';
import { HomeHeaderAuth } from '@/components/layout/HomeHeaderAuth';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(15,23,42,0.72)] py-2 shadow-lg shadow-sky-950/20 backdrop-blur-xl">
      <div className="mobile-header-width mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_18px_rgba(2,132,199,0.4)] shrink-0 flex items-center justify-center bg-slate-950">
              <Image
                src="/logo.png"
                alt="ZUP Logo Header - Nền tảng kết nối dịch vụ tiện ích tại nhà"
                width={40}
                height={40}
                priority
                className="h-full w-full scale-[1.38] object-cover"
              />
            </div>
            <span className="hidden text-2xl font-bold tracking-tight text-white md:block select-none">
              ZUP
            </span>
          </Link>

          {/* Search bar: ẩn trên mobile, slide-in khi cuộn qua Hero */}
          <div className="hidden sm:block flex-1 min-w-0">
            <HeaderSearchBar />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <HomeHeaderAuth />

            <details className="group relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 [&::-webkit-details-marker]:hidden">
                <Menu className="h-6 w-6 group-open:hidden" />
                <span className="hidden h-6 w-6 items-center justify-center text-xl font-semibold group-open:flex">×</span>
                <span className="sr-only">Mở menu</span>
              </summary>
              <nav className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <Link href="/services" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  Tìm dịch vụ
                </Link>
                <Link href="/bookings" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  Đơn hàng của tôi
                </Link>
                <Link href="/notifications" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  Thông báo
                </Link>
                <Link href="/profile" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  Tài khoản
                </Link>
                <div className="my-1 h-px bg-white/10" />
                <Link href="/login" className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  Đăng nhập thành viên.
                </Link>
                <Link href="/register" className="block rounded-lg px-4 py-3 text-sm font-bold text-cyan-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
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
