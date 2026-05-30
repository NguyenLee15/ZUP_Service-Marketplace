'use client';

import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: "Hoàng Anh.",
    location: "Gia chủ tại Hà Nội.",
    initials: "HA.",
    content: "\"Tôi cần gấp kỹ thuật viên sửa thiết bị giặt giũ do sự cố tràn ngập nước ra sàn. Thật may, chỉ chục phút sau khi đăng đơn, tay nghề viên đã chủ động gọi điện hỗ trợ. Hơn nữa, chi phí báo trước vô cùng chi tiết. Do đó, gia chủ hoàn toàn thư thái lòng.\"",
  },
  {
    name: "Minh Thư.",
    location: "Gia chủ tại Đà Nẵng.",
    initials: "MT.",
    content: "\"Tổ hỗ trợ dọn dẹp nhà cửa thi công rất đúng giờ và chuyên nghiệp. Ngoài ra, nhân viên vệ sinh lau dọn tỉ mỉ mọi góc khuất bụi bặm. Vì thế, không gian sống trở nên sáng sủa trong lành. Nhờ đó, người tiêu dùng cực kỳ tín nhiệm.\"",
  },
  {
    name: "Phan Thành.",
    location: "Gia chủ tại TP.HCM.",
    initials: "PT.",
    content: "\"Trước kia gia đình băn khoăn khi tìm đối tác khôi phục điện nước uy tín. Tuy nhiên, ứng dụng thông minh này đã tháo gỡ hoàn toàn trăn trở đó. Đặc biệt là hồ sơ năng lực và bình luận của người dùng trước rất khách quan. Từ đó, tôi dễ dàng đưa ra quyết định tối ưu.\"",
  },
];

const stats = [
  { value: '45,000+', label: 'Đơn thành công', color: 'text-cyan-400' },
  { value: '98.7%',   label: 'Hài lòng',       color: 'text-emerald-400' },
  { value: '100%',    label: 'Thợ kiểm định',   color: 'text-blue-400' },
  { value: '24/7',    label: 'Hỗ trợ',          color: 'text-amber-400' },
];

export function Testimonials() {
  return (
    <section id="danh-gia-khach-hang" className="space-y-8">
      <div className="text-center">
        <h2 id="y-kien-khach-hang" className="text-2xl md:text-[38px] font-bold brand-heading mb-3 leading-tight text-balance text-slate-100">
          Khách hàng nói gì?.
        </h2>
        <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-slate-400">
          Sự hài lòng của khách hàng là minh chứng rõ ràng nhất cho chất lượng dịch vụ trên nền tảng Zup.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <Card
            key={i}
            itemScope
            itemType="https://schema.org/Review"
            className="surface-card p-5 md:p-6 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-action-blue/25 relative rounded-[20px] overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-pale-gray/5 rounded-bl-full -z-10 group-hover:scale-105 transition-transform"></div>
            <Quote className="absolute top-5 right-5 w-8 h-8 text-slate-700 opacity-20" />

            {/* Schema Rating Metadata — giữ nguyên cho SEO */}
            <div className="flex gap-1 mb-4" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
              <meta itemProp="ratingValue" content="5" />
              <meta itemProp="bestRating" content="5" />
              {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
            </div>

            <p className="text-slate-300 dark:text-slate-200 mb-6 text-sm leading-relaxed" itemProp="reviewBody">
              {t.content}
            </p>

            <div className="flex items-center gap-3 border-t border-white/5 pt-4" itemProp="author" itemScope itemType="https://schema.org/Person">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white font-black text-xs shadow-[0_4px_12px_rgba(2,132,199,0.3)] shrink-0">
                {t.initials}
              </div>
              <div>
                <p className="font-bold text-slate-100 dark:text-white text-sm" itemProp="name">{t.name}</p>
                <p className="text-[11px] text-slate-400">{t.location}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Compact Stats Strip — số liệu tín nhiệm ngắn gọn */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
        {stats.map((s) => (
          <div key={s.label} className="surface-card p-4 rounded-2xl text-center transition-all hover:-translate-y-0.5 duration-300">
            <span className={`text-2xl md:text-3xl font-extrabold block mb-0.5 ${s.color}`}>{s.value}</span>
            <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
