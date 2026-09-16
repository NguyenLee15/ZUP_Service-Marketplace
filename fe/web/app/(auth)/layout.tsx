import { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Tài khoản - ZUP',
  description: 'Đăng nhập hoặc tạo tài khoản ZUP để trải nghiệm dịch vụ tiện ích gia đình uy tín, nhanh chóng.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-950">
      <header className="w-full border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
            aria-label="Về trang chủ ZUP"
          >
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-sky-600 text-base font-extrabold text-white shadow-sm">
              Z
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                ZUP
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                Dịch vụ gia đình
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center px-3 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg dark:text-slate-400 dark:hover:text-sky-400"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-8 pb-16 sm:px-6 sm:py-12 sm:pb-12 lg:py-16">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/60 px-4 py-4 dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="mx-auto max-w-md space-y-2 text-center text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Thông tin đăng nhập được bảo vệ trong suốt phiên làm việc</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ZUP Platform. Nền tảng dịch vụ tiện ích gia đình chuẩn mực.
          </p>
        </div>
      </footer>
    </div>
  );
}
