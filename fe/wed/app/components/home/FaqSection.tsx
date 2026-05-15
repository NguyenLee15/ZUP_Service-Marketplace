'use client';

import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Làm sao để tôi đặt lịch dịch vụ?", a: "Bạn chỉ cần tìm kiếm dịch vụ mong muốn, chọn thợ phù hợp, điền thông tin địa chỉ và thời gian. Sau khi nhấn xác nhận, thợ sẽ liên hệ lại để chốt lịch." },
  { q: "Tôi có mất phí khi hủy lịch không?", a: "Việc hủy lịch là hoàn toàn miễn phí nếu bạn thực hiện trước 2 giờ so với thời gian hẹn. Sau thời gian đó có thể phát sinh phí di chuyển cho thợ." },
  { q: "Làm sao để đảm bảo an toàn khi thợ đến nhà?", a: "Tất cả thợ đều được định danh (KYC) và có hồ sơ lý lịch rõ ràng. Bạn cũng có thể theo dõi trạng thái thợ đang di chuyển trên ứng dụng." },
  { q: "Nếu tôi không hài lòng với dịch vụ thì sao?", a: "Bạn có thể gửi khiếu nại ngay trong mục quản lý đơn hàng. Chúng tôi sẽ tạm giữ tiền thanh toán và giải quyết thỏa đáng cho bạn." }
];

export function FaqSection() {
  return (
    <section className="pb-10 md:pb-14">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-[38px] font-bold brand-heading flex items-center justify-center gap-3 text-balance">
            <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-action-blue" /> Câu hỏi thường gặp
          </h2>
          <p className="text-slate-blue mt-3 text-base md:text-lg">Giải đáp nhanh những thắc mắc của bạn về dịch vụ</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="surface-card px-5 md:px-6 rounded-2xl hover:border-action-blue/20 transition-[border-color,box-shadow]">
              <AccordionTrigger className="text-left font-bold text-midnight-indigo hover:no-underline py-5 text-base md:text-lg">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-blue pb-6 leading-relaxed text-base">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
