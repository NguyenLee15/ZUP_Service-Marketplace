'use client';

import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: "Hoàng Anh.",
    location: "Khách hàng tại Hà Nội.",
    initials: "HA.",
    content: "\"Mình cần thợ sửa máy giặt gấp, khoảng 15 phút sau đã có người nhận đơn và tới nhà xử lý. Giá báo rõ trước khi làm.\"",
  },
  {
    name: "Minh Thư.",
    location: "Khách hàng tại Đà Nẵng.",
    initials: "MT.",
    content: "\"Dịch vụ dọn dẹp nhà cửa làm đúng giờ, nhóm thợ nhiệt tình và chú ý các góc nhỏ. Tôi dễ theo dõi lịch hẹn trên hệ thống.\"",
  },
  {
    name: "Phan Thành.",
    location: "Khách hàng tại TP.HCM.",
    initials: "PT.",
    content: "\"Tôi chỉ cần gõ vấn đề đang gặp, danh sách thợ nước gần nhà hiện ra rõ giá và đánh giá. Việc chọn người phù hợp dễ hơn nhiều.\"",
  }
];

export function Testimonials() {
  return (
    <section id="danh-gia-khach-hang">
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-2xl md:text-[38px] font-bold brand-heading mb-4 leading-tight text-balance">
          Khách hàng nói gì?.
        </h2>
        <p className="text-slate-blue max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Sự hài lòng của khách hàng là minh chứng rõ ràng nhất cho chất lượng dịch vụ trên nền tảng Zup.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <Card 
            key={i} 
            itemScope 
            itemType="https://schema.org/Review"
            className="surface-card p-6 md:p-7 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-action-blue/25 relative rounded-[20px] overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pale-gray rounded-bl-full -z-10 group-hover:scale-105 transition-transform"></div>
            <Quote className="absolute top-6 right-6 w-9 h-9 text-steel-gray opacity-50" />
            
            {/* Schema Rating Metadata */}
            <div className="flex gap-1 mb-6" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
              <meta itemProp="ratingValue" content="5" />
              <meta itemProp="bestRating" content="5" />
              {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            
            <p className="text-slate-300 dark:text-slate-200 mb-8 text-base leading-relaxed" itemProp="reviewBody">
              {t.content}
            </p>
            
            <div className="flex items-center gap-4" itemProp="author" itemScope itemType="https://schema.org/Person">
              <div className="w-12 h-12 rounded-2xl bg-action-blue flex items-center justify-center text-white font-bold text-base shadow-[var(--brand-shadow-button)]">
                {t.initials}
              </div>
              <div>
                <p className="font-bold text-slate-100 dark:text-white text-base" itemProp="name">{t.name}</p>
                <p className="text-sm text-slate-400 dark:text-slate-400">{t.location}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
