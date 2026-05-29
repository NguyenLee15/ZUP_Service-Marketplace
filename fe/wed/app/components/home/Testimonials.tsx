'use client';

import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: "Hoàng Anh.",
    location: "Khách hàng tại Hà Nội.",
    initials: "HA.",
    content: "\"Tôi đang cần tìm gấp thợ sửa chữa máy giặt do bị tràn nước ra sàn nhà. May mắn thay, chỉ khoảng 15 phút sau khi đặt trên Zup, thợ kỹ thuật đã liên hệ ngay. Hơn nữa, mức giá dịch vụ được công khai rất minh bạch. Do đó, tôi cảm thấy cực kỳ hài lòng và yên tâm.\"",
  },
  {
    name: "Minh Thư.",
    location: "Khách hàng tại Đà Nẵng.",
    initials: "MT.",
    content: "\"Dịch vụ dọn dẹp nhà cửa tại đây thực sự làm việc rất đúng giờ và kỹ lưỡng. Ngoài ra, các bạn thợ còn dọn dẹp sạch cả những góc nhỏ khuất sau tủ. Vì vậy, ngôi nhà của tôi đã trở nên sạch sẽ như mới. Nhờ vậy, tôi sẽ tiếp tục ủng hộ lâu dài.\"",
  },
  {
    name: "Phan Thành.",
    location: "Khách hàng tại TP.HCM.",
    initials: "PT.",
    content: "\"Trước đây tôi gặp rất nhiều khó khăn để tìm thợ sửa điện nước đáng tin cậy. Tuy nhiên, hệ thống Zup đã giúp tôi giải quyết triệt để nỗi lo này. Đặc biệt là các thông tin phản hồi và đánh giá của khách hàng trước đều được hiển thị rõ ràng. Do đó, việc lựa chọn thợ phù hợp trở nên vô cùng nhanh chóng.\"",
  },
  {
    name: "Quỳnh Dao.",
    location: "Khách hàng tại Hải Phòng.",
    initials: "QD.",
    content: "\"Tôi rất ấn tượng với dịch vụ làm sạch và bảo dưỡng điều hòa của Zup. Thợ kỹ thuật thao tác rất chuyên nghiệp và nhanh nhẹn. Hơn nữa, họ còn chủ động hướng dẫn tôi cách sử dụng để tiết kiệm điện. Do đó, tôi đánh giá dịch vụ đạt chuẩn 5 sao.\"",
  },
  {
    name: "Quốc Bảo.",
    location: "Khách hàng tại Cần Thơ.",
    initials: "QB.",
    content: "\"Zup thực sự là một cứu cách tuyệt vời khi đường ống nước nhà tôi bị rò rỉ lúc nửa đêm. Nhờ có tính năng kết nối thông minh, thợ sửa ống nước gần nhà đã có mặt tức thì. Ngoài ra, chi phí sửa chữa ban đêm cũng rất hợp lý. Vì vậy, tôi cực kỳ tin tưởng.\"",
  },
  {
    name: "Lan Hương.",
    location: "Khách hàng tại Nha Trang.",
    initials: "LH.",
    content: "\"Giao diện của Zup rất thân thiện và dễ dàng thao tác cho người lớn tuổi như tôi. Chỉ với vài lần nhấp chuột, tôi đã tìm được thợ lau kính chuyên nghiệp. Hơn nữa, đội ngũ chăm sóc khách hàng còn gọi điện hỏi thăm sau dịch vụ. Vì thế, tôi đánh giá rất cao sự chu đáo này.\"",
  }
];

export function Testimonials() {
  return (
    <section id="danh-gia-khach-hang" className="space-y-10">
      <div className="text-center mb-10 md:mb-12">
        <h2 id="y-kien-khach-hang" className="text-2xl md:text-[38px] font-bold brand-heading mb-4 leading-tight text-balance text-slate-100">
          Khách hàng nói gì?.
        </h2>
        <p className="text-slate-blue max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-slate-400">
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
            <div className="absolute top-0 right-0 w-24 h-24 bg-pale-gray/5 rounded-bl-full -z-10 group-hover:scale-105 transition-transform"></div>
            <Quote className="absolute top-6 right-6 w-9 h-9 text-slate-700 opacity-20" />
            
            {/* Schema Rating Metadata */}
            <div className="flex gap-1 mb-5" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
              <meta itemProp="ratingValue" content="5" />
              <meta itemProp="bestRating" content="5" />
              {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            
            <p className="text-slate-300 dark:text-slate-200 mb-8 text-sm leading-relaxed min-h-[96px]" itemProp="reviewBody">
              {t.content}
            </p>
            
            <div className="flex items-center gap-4 border-t border-white/5 pt-4" itemProp="author" itemScope itemType="https://schema.org/Person">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-[0_4px_12px_rgba(2,132,199,0.3)]">
                {t.initials}
              </div>
              <div>
                <p className="font-bold text-slate-100 dark:text-white text-sm" itemProp="name">{t.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">{t.location}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Trust & Operations Statistics Dashboard */}
      <div className="mt-14 md:mt-16 pt-10 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="surface-card p-5 md:p-6 rounded-[20px] text-center transition-all hover:-translate-y-1 hover:border-cyan-400/30 duration-300 group">
            <span className="text-3xl md:text-4xl font-extrabold text-cyan-400 block mb-1 group-hover:scale-105 transition-transform duration-300">45,000+</span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-300/80 mb-2">Đơn hàng thành công</p>
            <p className="text-xs text-slate-400 leading-relaxed text-balance">
              Hàng ngàn gia đình đã được hỗ trợ xử lý sự cố. Hơn nữa, tỷ lệ kết nối thợ đạt mức ấn tượng. Do đó, bạn hoàn toàn có thể an tâm tin tưởng.
            </p>
          </div>
          <div className="surface-card p-5 md:p-6 rounded-[20px] text-center transition-all hover:-translate-y-1 hover:border-emerald-400/30 duration-300 group">
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-400 block mb-1 group-hover:scale-105 transition-transform duration-300">98.7%</span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300/80 mb-2">Hài lòng tuyệt đối</p>
            <p className="text-xs text-slate-400 leading-relaxed text-balance">
              Khách hàng đánh giá dịch vụ đạt tiêu chuẩn 5 sao. Ngoài ra, Zup luôn hỗ trợ giải quyết sự cố tức thì. Vì vậy, chất lượng luôn được đảm bảo.
            </p>
          </div>
          <div className="surface-card p-5 md:p-6 rounded-[20px] text-center transition-all hover:-translate-y-1 hover:border-blue-400/30 duration-300 group">
            <span className="text-3xl md:text-4xl font-extrabold text-blue-400 block mb-1 group-hover:scale-105 transition-transform duration-300">100%</span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300/80 mb-2">Thợ được kiểm định</p>
            <p className="text-xs text-slate-400 leading-relaxed text-balance">
              Tất cả thợ đối tác đều sở hữu chứng chỉ hành nghề hợp pháp. Hơn nữa, lý lịch tư pháp đều được xác minh tỉ mỉ. Do đó, tổ ấm của bạn luôn an toàn.
            </p>
          </div>
          <div className="surface-card p-5 md:p-6 rounded-[20px] text-center transition-all hover:-translate-y-1 hover:border-amber-400/30 duration-300 group">
            <span className="text-3xl md:text-4xl font-extrabold text-amber-400 block mb-1 group-hover:scale-105 transition-transform duration-300">24/7</span>
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-300/80 mb-2">Hỗ trợ tận tâm</p>
            <p className="text-xs text-slate-400 leading-relaxed text-balance">
              Đội ngũ chăm sóc và xử lý tranh chấp hoạt động liên tục. Đặc biệt là luôn bảo vệ quyền lợi người tiêu dùng tối đa. Vì thế, sự cố sẽ được giải quyết nhanh gọn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
