import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Play, ShieldCheck, CreditCard, Headphones } from "lucide-react";
import {
  DeferredSocialFeedSection,
} from "@/components/social/DeferredSocialWidgets";

export function CustomerFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 pt-10 pb-6 text-slate-600 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:pt-16 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="space-y-4">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 group active:scale-95 transition-transform duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                Z
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-slate-900 select-none dark:text-white">
                ZUP
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              ZUP giúp bạn tìm, đặt lịch và theo dõi dịch vụ tại nhà với thông tin rõ ràng và thợ lành nghề tận tâm.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook ZUP"
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube ZUP"
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Play className="size-5" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok ZUP"
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.99-1.72-.08-.07-.15-.15-.22-.23v6.52c-.04 2.87-1.43 5.72-3.93 7.15-2.52 1.45-5.91 1.45-8.43-.01-2.49-1.44-3.87-4.29-3.9-7.17-.03-2.88 1.36-5.73 3.86-7.17 2.1-1.21 4.75-1.39 6.99-.48v4.11c-1.57-.71-3.52-.45-4.79.68-1.28 1.13-1.63 3.09-.85 4.62.77 1.53 2.53 2.44 4.24 2.22 1.71-.22 3.03-1.64 3.07-3.37v-13.9c.01-.15.01-.3.01-.45z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter X ZUP"
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="mb-4 text-base font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-lg">
              Dịch vụ phổ biến
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/services?categoryIds=1"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Vệ sinh nhà cửa
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=2"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Đặt lịch Vệ sinh máy lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=3"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Sửa chữa điện nước
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=4"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Sửa chữa điện lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=5"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Thông tắc bồn cầu, cống
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-base font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-lg">
              Hỗ trợ khách hàng
            </div>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="text-muted-foreground cursor-default flex items-center">
                  <span className="inline-block w-[140px] shrink-0">Trung tâm trợ giúp</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-glacier-blue shrink-0">
                    Sắp ra mắt
                  </span>
                </div>
              </li>
              <li>
                <div className="text-muted-foreground cursor-default flex items-center">
                  <span className="inline-block w-[140px] shrink-0">An toàn mua bán</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-glacier-blue shrink-0">
                    Sắp ra mắt
                  </span>
                </div>
              </li>
              <li>
                <div className="text-muted-foreground cursor-default flex items-center">
                  <span className="inline-block w-[140px] shrink-0">Quy định cần biết</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-glacier-blue shrink-0">
                    Sắp ra mắt
                  </span>
                </div>
              </li>
              <li>
                <Link
                  href="/services"
                  prefetch={false}
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Dịch vụ của chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-base font-bold text-slate-900 dark:text-white sm:mb-6 sm:text-lg">
              Liên hệ & Hỗ trợ
            </div>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-action-blue shrink-0 mt-0.5" />
                <span>123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-action-blue shrink-0" />
                <a
                  href="tel:19001234"
                  className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  1900 1234 (1000đ/phút)
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-action-blue shrink-0" />
                <span className="text-muted-foreground">
                  Gửi yêu cầu hỗ trợ trong chi tiết đơn hàng
                </span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-action-blue shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <a
                  href="https://zalo.me/0901234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded font-semibold text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Chat Hỗ Trợ Zalo (0901 234 567)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Security & Payment Trust Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 pb-2 dark:border-slate-800">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">An toàn & Bảo mật</span>
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                title="Thông tin đặt lịch được bảo vệ qua kết nối HTTPS"
              >
                <ShieldCheck className="size-3.5 text-emerald-400" /> Kết nối bảo mật SSL
              </span>
              <span
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                title="Cổng thanh toán điện tử PayOS tích hợp mã VietQR tự động"
              >
                <CreditCard className="size-3.5 text-sky-400" /> Thanh toán số PayOS
              </span>
              <span
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                title="Đội ngũ hỗ trợ giải quyết yêu cầu và đơn hàng nhanh chóng"
              >
                <Headphones className="size-3.5 text-amber-400" /> Hỗ trợ khách hàng
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chuẩn mực chất lượng</span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Thợ xác thực danh tính · Báo giá minh bạch · Nghiệm thu trước khi hoàn tất
            </p>
          </div>
        </div>

        <DeferredSocialFeedSection />

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-center dark:border-slate-800 md:flex-row sm:pt-8 sm:text-left">
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-500" suppressHydrationWarning>
              © {new Date().getFullYear()} ZUP Platform. Mọi quyền được bảo lưu.
            </p>
            <p className="text-[11px] text-slate-500" suppressHydrationWarning>
              Thông tin dịch vụ và chính sách có thể thay đổi theo khu vực.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              prefetch={false}
              className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/terms"
              prefetch={false}
              className="rounded text-slate-600 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue dark:text-slate-400 dark:hover:text-sky-400"
            >
              Điều khoản sử dụng
            </Link>
            <span>Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
