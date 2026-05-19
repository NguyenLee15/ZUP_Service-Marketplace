import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  FooterSocialLinks,
  SocialFeedSection,
} from "@/components/social/SocialWidgets";

export function CustomerFooter() {
  return (
    <footer className="bg-white text-muted-foreground pt-10 sm:pt-16 pb-6 sm:pb-8 border-t border-platinum-tint transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              <div className="w-8 h-8 rounded-lg bg-action-blue flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
              <span className="font-bold text-xl text-midnight-indigo tracking-tight">
                Home<span className="text-action-blue">Service</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Nền tảng kết nối dịch vụ tại nhà uy tín hàng đầu. Chúng tôi mang
              đến giải pháp nhanh chóng, an toàn và tiện lợi cho mọi nhu cầu sửa
              chữa, dọn dẹp của gia đình bạn.
            </p>
            <FooterSocialLinks />
          </div>

          <div>
            <h3 className="text-foreground font-semibold text-lg mb-6">
              Dịch vụ phổ biến
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/services?categoryIds=1"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Vệ sinh nhà cửa
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=2"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Vệ sinh máy lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=3"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Sửa chữa điện nước
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=4"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Sửa chữa điện lạnh
                </Link>
              </li>
              <li>
                <Link
                  href="/services?categoryIds=5"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Thông tắc bồn cầu, cống
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold text-lg mb-6">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground/60 cursor-default flex items-center gap-1">
                  Trung tâm trợ giúp{" "}
                  <span className="text-[9px] uppercase tracking-wider font-bold text-action-blue/70">
                    Sắp ra mắt
                  </span>
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-default flex items-center gap-1">
                  An toàn mua bán{" "}
                  <span className="text-[9px] uppercase tracking-wider font-bold text-action-blue/70">
                    Sắp ra mắt
                  </span>
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-default flex items-center gap-1">
                  Quy định cần biết{" "}
                  <span className="text-[9px] uppercase tracking-wider font-bold text-action-blue/70">
                    Sắp ra mắt
                  </span>
                </span>
              </li>
              <li>
                <Link
                  href="/services"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  Dịch vụ của chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold text-lg mb-6">
              Liên hệ
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
                  href="mailto:support@homeservice.vn"
                  className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  support@homeservice.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <SocialFeedSection />

        <div className="pt-6 sm:pt-8 border-t border-platinum-tint flex flex-col md:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} HomeService Marketplace. Mọi quyền được
            bảo lưu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="rounded hover:text-action-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/terms"
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
