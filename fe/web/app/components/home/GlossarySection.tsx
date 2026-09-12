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
    <section className="pt-6 pb-10 border-t border-slate-200/80 dark:border-slate-800 space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2.5">
        <HelpCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
        <h2 id="giai-dap-truc-tiep" className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
          Câu hỏi thường gặp
        </h2>
      </div>

      <Accordion type="single" collapsible className="grid md:grid-cols-2 gap-2">
        {homeFaqs.map((item, index) => (
          <AccordionItem
            key={index}
            value={`direct-${index}`}
            className="bg-white dark:bg-slate-900 px-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/40 shadow-xs transition-colors"
          >
            <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 hover:no-underline py-3.5 text-sm">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed text-xs sm:text-sm">
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
