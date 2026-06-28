'use client';

import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: "Hoàng Anh",
    location: "Khách hàng tại Hà Nội",
    initials: "HA",
    content: "Tôi đặt sửa máy giặt và nhận được báo giá trước khi thợ đến. Lịch hẹn, tin nhắn và trạng thái đơn đều nằm trong một chỗ nên dễ theo dõi.",
  },
  {
    name: "Minh Thư",
    location: "Khách hàng tại Đà Nẵng",
    initials: "MT",
    content: "Tôi thích nhất là có thể xem thông tin dịch vụ và đánh giá trước khi đặt. Khi cần đổi lịch, tôi nhắn trực tiếp trong đơn nên không bị rối.",
  },
  {
    name: "Phan Thành",
    location: "Khách hàng tại TP.HCM",
    initials: "PT",
    content: "Trước khi xác nhận, tôi xem được giá tham khảo và trao đổi thêm với thợ. Sau khi hoàn tất, tôi vẫn có lịch sử đơn để kiểm tra lại khi cần.",
  },
];

const stats = [
  { value: 'Rõ giá', label: 'Báo giá trước khi làm', color: 'text-cyan-400' },
  { value: 'Có hồ sơ', label: 'Thông tin thợ để so sánh', color: 'text-emerald-400' },
  { value: 'Theo dõi', label: 'Lịch sử đơn và tin nhắn', color: 'text-blue-400' },
  { value: 'Hỗ trợ', label: 'Kênh xử lý khi phát sinh', color: 'text-amber-400' },
];

export function Testimonials() {
  return (
    <section id="danh-gia-khach-hang" className="space-y-8">
      <div className="text-center">
        <h2 id="y-kien-khach-hang" className="text-2xl md:text-[38px] font-bold brand-heading mb-3 leading-tight text-balance text-slate-100">
          Khách hàng nói gì?
        </h2>
        <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-slate-400">
          Những phản hồi dưới đây mô tả cách Zup giúp việc đặt dịch vụ tại nhà rõ ràng và dễ theo dõi hơn.
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
