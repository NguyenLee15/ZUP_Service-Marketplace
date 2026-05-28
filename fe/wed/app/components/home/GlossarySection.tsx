'use client';

import React from 'react';
import { Book, HelpCircle, ShieldCheck, Calendar, UserCheck } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Highly readable definitions. All sentences are kept under 20 words.
const definitions = [
  {
    term: "Dịch vụ tại nhà (Home Services)",
    definition: "Là mô hình cung cấp các tiện ích gia đình trực tiếp. Dịch vụ sửa chữa điện tử, dọn dẹp vệ sinh được phục vụ tận nơi. Quy trình diễn ra nhanh chóng tại nhà của khách hàng."
  },
  {
    term: "Thợ xác thực (Verified Providers)",
    definition: "Tất cả đối tác đều được kiểm duyệt chặt chẽ. Hồ sơ cá nhân (KYC) được xác minh minh bạch. Zup kiểm tra lý lịch tư pháp và đánh giá tay nghề thực tế."
  },
  {
    term: "Đặt lịch thông minh (Smart Booking)",
    definition: "Quy trình kết nối thợ trực tuyến theo thời gian thực. Hệ thống tự động tìm thợ gần bạn nhất. Giá cả được niêm yết rõ ràng kèm theo đánh giá thực tế."
  }
];

// Highly readable direct answers. All sentences are kept under 20 words.
const directAnswers = [
  {
    q: "Làm thế nào để đảm bảo giá thợ sửa chữa là minh bạch, không chặt chém?",
    a: "Zup yêu cầu thợ niêm yết công khai bảng giá tham khảo. Thợ sửa chữa phải gửi phiếu báo giá chi tiết qua hệ thống. Bạn cần xác nhận phiếu báo giá này trước khi thợ làm việc."
  },
  {
    q: "Quy trình khiếu nại và hoàn tiền hoạt động như thế nào khi chất lượng không đạt?",
    a: "Zup sẽ tạm giữ số tiền thanh toán giao dịch trong 24 giờ. Đội ngũ kỹ thuật viên của Zup sẽ lập tức xác minh lỗi. Chúng tôi cam kết sửa lại miễn phí hoặc hoàn tiền 100%."
  }
];

export function GlossarySection() {
  return (
    <section className="pt-8 pb-14 border-t border-slate-800 space-y-8 animate-in fade-in duration-500">
      {/* E-E-A-T Professional Verification Block */}
      <div className="surface-card p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-500/5 to-teal-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-action-blue/10 rounded-2xl text-action-blue shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Nội dung được kiểm chứng chuyên môn
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg flex flex-wrap items-center gap-2">
              Chất lượng & Tiêu chuẩn vận hành Zup
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Các tài liệu hướng dẫn và thuật ngữ được biên soạn bởi ban kiểm định chất lượng Zup. Quy trình kiểm tra định kỳ nghiêm ngặt nhằm bảo vệ tối đa lợi ích khách hàng.
            </p>
          </div>
        </div>
        
        {/* Author details & Timestamps */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] leading-none mb-0.5">Kiểm định bởi</p>
              <p className="text-slate-900 dark:text-white font-bold">Lê Hoàng Nguyễn</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-action-blue shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] leading-none mb-0.5">Cập nhật lúc</p>
              <p className="text-slate-900 dark:text-white font-bold">28/05/2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Glossary & Terms Definitions */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <Book className="w-6 h-6 text-action-blue shrink-0" />
            <h2 id="thuat-ngu-dich-vu" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Thuật ngữ & Khái niệm dịch vụ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Giải nghĩa các khái niệm kỹ thuật và tiêu chuẩn chất lượng dịch vụ tại nhà trên nền tảng Zup.
          </p>
          <div className="space-y-4">
            {definitions.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:shadow-sm transition-all"
              >
                <h3 className="font-bold text-sm text-action-blue mb-1">
                  {item.term}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Q&A (Citability Answers) */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-action-blue shrink-0" />
            <h2 id="giai-dap-truc-tiep" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Giải đáp trực tiếp từ chuyên gia Zup
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Câu trả lời trực tiếp cho các thắc mắc phổ biến về quy chế vận hành và chính sách bảo vệ khách hàng.
          </p>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {directAnswers.map((item, index) => (
              <AccordionItem
                key={index}
                value={`direct-${index}`}
                className="surface-card px-4 rounded-xl hover:border-action-blue/20 transition-all border border-slate-100 dark:border-slate-800"
              >
                <AccordionTrigger className="text-left font-bold text-slate-900 dark:text-white hover:no-underline py-4 text-sm sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400 pb-5 leading-relaxed text-xs sm:text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
