import { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Tài khoản - ZUP',
  description: 'Đăng nhập hoặc tạo tài khoản ZUP để trải nghiệm dịch vụ tiện ích gia đình uy tín, nhanh chóng.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-slate-50 dark:bg-slate-950">
      <header className="w-full border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-13 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
            aria-label="Về trang chủ ZUP"
          >
            <div className="relative flex size-7 items-center justify-center rounded-lg bg-sky-600 text-sm font-extrabold text-white shadow-sm">
              Z
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                ZUP
              </span>
              <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                Dịch vụ gia đình
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg dark:text-slate-400 dark:hover:text-sky-400"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-2 sm:px-6 sm:py-3 my-auto">
        <div className="w-full max-w-[430px]">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/60 px-4 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="mx-auto max-w-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Thông tin đăng nhập được bảo vệ</span>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ZUP Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
