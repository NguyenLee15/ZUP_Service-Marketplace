import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Tài khoản - ZUP',
  description: 'Đăng nhập hoặc tạo tài khoản ZUP để trải nghiệm dịch vụ tiện ích gia đình uy tín, nhanh chóng.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-slate-50/80 dark:bg-slate-950">
      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg p-1"
            aria-label="Về trang chủ ZUP"
          >
            <div className="relative w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
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
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      {/* Main Centered Content */}
      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>

      {/* Bottom Trust Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-md mx-auto text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cam kết an toàn dữ liệu và bảo mật 100%</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} ZUP Platform. Nền tảng dịch vụ tiện ích gia đình chuẩn mực.
          </p>
        </div>
      </footer>
    </div>
  );
}
