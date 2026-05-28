'use client';

import React from 'react';
import { Book, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const definitions = [
  {
    term: "Dịch vụ tại nhà (Home Services)",
    definition: "Là mô hình cung cấp các dịch vụ tiện ích trực tiếp tại gia đình khách hàng bao gồm sửa chữa thiết bị điện tử, điện lạnh, thông tắc vệ sinh, lắp đặt camera, và chăm sóc cá nhân di động."
  },
  {
    term: "Thợ xác thực (Verified Providers)",
    definition: "Tất cả đối tác gia nhập nền tảng Zup đều bắt buộc trải qua quy trình định danh cá nhân (KYC), xác minh tay nghề chuyên môn, kiểm tra lý lịch tư pháp và đánh giá tác phong phục vụ thực tế."
  },
  {
    term: "Đặt lịch thông minh (Smart Booking)",
    definition: "Quy trình lựa chọn thợ trực tuyến theo thời gian thực dựa trên vị trí gần nhất, giá niêm yết rõ ràng của từng dịch vụ và các lượt đánh giá trung thực từ cộng đồng khách hàng thực tế."
  }
];

const directAnswers = [
  {
    q: "Làm thế nào để đảm bảo giá thợ sửa chữa là minh bạch, không chặt chém?",
    a: "Nền tảng Zup yêu cầu thợ niêm yết công khai bảng giá tham khảo cho từng đầu việc. Đối với các công việc phát sinh phức tạp, thợ bắt buộc phải gửi phiếu báo giá chi tiết thông qua hệ thống cho bạn xác nhận trước khi tiến hành sửa chữa."
  },
  {
    q: "Quy trình khiếu nại và hoàn tiền của Zup hoạt động như thế nào khi chất lượng không đạt yêu cầu?",
    a: "Khi bạn mở tranh chấp, Zup sẽ đóng băng số tiền thanh toán giao dịch trong vòng 24 giờ. Đội ngũ kỹ thuật viên độc lập của chúng tôi sẽ đánh giá lỗi kỹ thuật và tiến hành phán quyết để sửa lại miễn phí hoặc hoàn tiền 100% cho bạn."
  }
];

export function GlossarySection() {
  return (
    <section className="pt-6 pb-12 border-t border-slate-800">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Glossary & Terms Definitions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <Book className="w-6 h-6 text-action-blue shrink-0" />
            <h2 id="thuat-ngu-dich-vu" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Thuật ngữ & Khái niệm dịch vụ
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
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
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-action-blue shrink-0" />
            <h2 id="giai-dap-truc-tiep" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Giải đáp trực tiếp từ chuyên gia Zup
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
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
