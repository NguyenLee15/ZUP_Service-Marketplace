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
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 md:grid md:grid-cols-[1.15fr_0.85fr]">
      <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-slate-950 text-white md:flex md:flex-col md:justify-between md:p-10 lg:p-14">
        <Image
          src="/images/hero_bg.webp"
          alt="Không gian nhà ở sạch sẽ và tiện nghi"
          fill
          priority
          sizes="58vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-slate-900/50" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-extrabold shadow-sm">Z</div>
          <div>
            <div className="text-xl font-extrabold tracking-tight">ZUP</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">Dịch vụ gia đình</div>
          </div>
        </div>
        <div className="relative z-10 max-w-xl pb-10 lg:pb-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Tìm người phù hợp cho việc cần làm</p>
          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
            Nhà cửa gọn gàng, lịch hẹn rõ ràng.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-200">
            Đăng nhập để đặt dịch vụ, xem báo giá và theo dõi tiến độ ngay trên một nền tảng.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/20 pt-5 text-sm">
            <div><div className="font-semibold">Đặt lịch</div><div className="mt-1 text-xs text-slate-300">Theo nhu cầu</div></div>
            <div><div className="font-semibold">Báo giá</div><div className="mt-1 text-xs text-slate-300">Trước khi duyệt</div></div>
            <div><div className="font-semibold">Theo dõi</div><div className="mt-1 text-xs text-slate-300">Từng trạng thái</div></div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <p className="text-xs italic text-slate-200 leading-relaxed">
              &ldquo;Đặt thợ qua ZUP giúp gia đình tôi hoàn toàn yên tâm. Thợ lịch sự, kiểm tra kỹ lưỡng, báo giá minh bạch trước khi làm.&rdquo;
            </p>
            <p className="mt-2 text-[11px] font-semibold text-sky-300">
              Chị Ngọc Lan — Khách hàng tại TP. Hồ Chí Minh (5.0 ★)
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-950">
        <header className="w-full border-b border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-8">
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
            className="text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-sky-400"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:py-12">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/50 px-4 py-4 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="mx-auto max-w-md space-y-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Thông tin đăng nhập được bảo vệ trong suốt phiên làm việc</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} ZUP Platform. Nền tảng dịch vụ tiện ích gia đình chuẩn mực.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
