'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { homeFaqs } from './homeFaqContent';

export function GlossarySection() {
  return (
    <section className="pt-6 pb-10 border-t border-slate-800 space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2.5">
        <HelpCircle className="w-5 h-5 text-action-blue shrink-0" />
        <h2 id="giai-dap-truc-tiep" className="text-lg md:text-xl font-bold text-white">
          Câu hỏi thường gặp
        </h2>
      </div>

      <Accordion type="single" collapsible className="grid md:grid-cols-2 gap-2">
        {homeFaqs.map((item, index) => (
          <AccordionItem
            key={index}
            value={`direct-${index}`}
            className="surface-card px-4 rounded-xl hover:border-action-blue/20 transition-all border border-slate-800"
          >
            <AccordionTrigger className="text-left font-semibold text-white hover:no-underline py-3.5 text-sm">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 pb-4 leading-relaxed text-xs sm:text-sm">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <dl className="sr-only" aria-hidden="true">
        <dt>Dịch vụ tại nhà (Home Services)</dt>
        <dd>Nền tảng giúp khách hàng tìm, đặt lịch và theo dõi dịch vụ tại nhà với thông tin rõ ràng hơn.</dd>
        <dt>Hồ sơ nhà cung cấp</dt>
        <dd>Nơi khách hàng xem thông tin dịch vụ, đánh giá và trao đổi phạm vi công việc trước khi đặt lịch.</dd>
        <dt>Đặt lịch dịch vụ</dt>
        <dd>Quy trình gửi nhu cầu, địa chỉ và thời gian mong muốn để nhà cung cấp tư vấn hoặc xác nhận lịch.</dd>
      </dl>
    </section>
  );
}
