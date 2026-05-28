import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300 font-extrabold">
                <span className="text-sm font-bold">Z</span>
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-white">
                Z<span className="text-sky-400">up</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Nền tảng kết nối dịch vụ tại nhà uy tín hàng đầu. Chúng tôi mang
              đến giải pháp nhanh chóng, an toàn và tiện lợi cho mọi nhu cầu sửa
              chữa, dọn dẹp của gia đình bạn.
            </p>
            <DeferredFooterSocialLinks />
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
                  Vệ sinh máy lạnh
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
                  support@zup.vn
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
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-emerald-400 select-none shadow-sm">
                <span className="text-[9px]">🛡️</span> SSL SECURED
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-sky-400 select-none shadow-sm">
                <span className="text-[9px]">💳</span> VNPAY PARTNER
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-black text-amber-500 select-none shadow-sm">
                <span className="text-[9px]">⭐</span> PCI-DSS COMPLIANT
              </div>
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
