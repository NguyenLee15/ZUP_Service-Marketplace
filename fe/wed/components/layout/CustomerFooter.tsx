import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Play } from "lucide-react";
import {
  DeferredFooterSocialLinks,
  DeferredSocialFeedSection,
} from "@/components/social/DeferredSocialWidgets";

export function CustomerFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-10 sm:pt-16 pb-6 sm:pb-8 border-t border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="space-y-4">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue group active:scale-95 transition-transform duration-200"
            >
              <div className="w-8 h-8 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_12px_rgba(2,132,199,0.3)] shrink-0 flex items-center justify-center bg-slate-950">
                <Image
                  src="/logo.png"
                  alt="ZUP Logo Footer - Hệ thống kết nối thợ chuyên nghiệp uy tín"
                  width={32}
                  height={32}
                  className="h-full w-full scale-[1.38] object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-white select-none">
                ZUP
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Nền tảng kết nối dịch vụ tại nhà uy tín hàng đầu. Chúng tôi mang
              đến giải pháp nhanh chóng, an toàn và tiện lợi cho mọi nhu cầu sửa
              chữa, dọn dẹp của gia đình bạn.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com/zup.vn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook ZUP"
                className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-sky-600 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="https://youtube.com/@zupvn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube ZUP"
                className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <Play className="size-5" />
              </a>
              <a
                href="https://tiktok.com/@zup.vn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok ZUP"
                className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-neutral-800 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.99-1.72-.08-.07-.15-.15-.22-.23v6.52c-.04 2.87-1.43 5.72-3.93 7.15-2.52 1.45-5.91 1.45-8.43-.01-2.49-1.44-3.87-4.29-3.9-7.17-.03-2.88 1.36-5.73 3.86-7.17 2.1-1.21 4.75-1.39 6.99-.48v4.11c-1.57-.71-3.52-.45-4.79.68-1.28 1.13-1.63 3.09-.85 4.62.77 1.53 2.53 2.44 4.24 2.22 1.71-.22 3.03-1.64 3.07-3.37v-13.9c.01-.15.01-.3.01-.45z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com/zupvn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter X ZUP"
                className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-neutral-800 hover:text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-6">
              Dịch vụ phổ biến
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/services?categoryIds=1"
                  prefetch={false}
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Vệ sinh nhà cửa
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=2"
                  prefetch={false}
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Đặt lịch Vệ sinh máy lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=3"
                  prefetch={false}
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Sửa chữa điện nước
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=4"
                  prefetch={false}
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Sửa chữa điện lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=5"
                  prefetch={false}
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Thông tắc bồn cầu, cống
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-6">
              Hỗ trợ khách hàng
            </h3>
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
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Dịch vụ của chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-6">
              Liên hệ & Hỗ trợ
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-action-blue shrink-0 mt-0.5" />
                <span>123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-action-blue shrink-0" />
                <a
                  href="tel:19001234"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  1900 1234 (1000đ/phút)
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-action-blue shrink-0" />
                <a
                  href="mailto:support@zup.vn"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Gửi email hỗ trợ (support@zup.vn)
                </a>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-action-blue shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <a
                  href="https://zalo.me/0901234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue font-semibold text-sky-400"
                >
                  Chat Hỗ Trợ Zalo (0901 234 567)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Security & Payment Trust Badges */}
        <div className="pt-6 pb-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chứng nhận & An toàn</span>
            <div className="flex items-center gap-3">
              <a
                href="https://vi.wikipedia.org/wiki/An_to%C3%A0n_%C4%91i%E1%BB%87n"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-emerald-400 shadow-sm hover:border-emerald-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title="Quy chuẩn an toàn điện Wikipedia"
              >
                <span className="text-[9px]">🛡️</span> SSL SECURED
              </a>
              <a
                href="https://online.gov.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-sky-400 shadow-sm hover:border-sky-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Trang thông tin Bộ Công Thương đã đăng ký"
              >
                <span className="text-[9px]">💳</span> VNPAY PARTNER
              </a>
              <a
                href="https://www.iso.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-amber-500 shadow-sm hover:border-amber-600 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Tiêu chuẩn quản lý chất lượng dịch vụ ISO 9001"
              >
                <span className="text-[9px]">⭐</span> PCI-DSS COMPLIANT
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cổng thanh toán hỗ trợ</span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-bold text-slate-300">VISA</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-bold text-slate-300">MASTERCARD</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-bold text-slate-300">ATM / VNPAY</span>
            </div>
          </div>
        </div>

        <DeferredSocialFeedSection />

        <div className="pt-6 sm:pt-8 border-t border-platinum-tint flex flex-col md:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              © {new Date().getFullYear()} Zup Marketplace. Mọi quyền được bảo lưu.
            </p>
            <p className="text-[11px] text-slate-600" suppressHydrationWarning>
              Dịch vụ được kiểm định chất lượng nghiêm ngặt. Thông tin cập nhật lần cuối: 28/05/2026.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              prefetch={false}
              className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/terms"
              prefetch={false}
              className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
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
