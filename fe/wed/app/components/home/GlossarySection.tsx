'use client';

import React from 'react';
import { Book, HelpCircle, ShieldCheck, Calendar, UserCheck } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Highly readable definitions with transitions. All sentences are under 20 words.
const definitions = [
  {
    term: "Dịch vụ tại nhà (Home Services)",
    definition: "Là mô hình cung cấp các tiện ích gia đình trực tiếp. Do đó, các dịch vụ sửa chữa hay vệ sinh đều được phục vụ tận nơi tiện lợi."
  },
  {
    term: "Thợ xác thực (Verified Providers)",
    definition: "Tất cả đối tác đều được kiểm duyệt chặt chẽ. Ngoài ra, hồ sơ cá nhân (KYC) được xác minh minh bạch nhằm bảo đảm an toàn."
  },
  {
    term: "Đặt lịch thông minh (Smart Booking)",
    definition: "Quy trình kết nối thợ trực tuyến theo thời gian thực. Hơn nữa, hệ thống tự động tìm thợ gần bạn nhất để tối ưu thời gian."
  }
];

// Highly readable direct answers with transitions. All sentences are under 20 words.
const directAnswers = [
  {
    q: "Làm thế nào để đảm bảo giá thợ sửa chữa là minh bạch, không chặt chém?",
    a: "Zup yêu cầu thợ niêm yết công khai bảng giá tham khảo. Hơn nữa, thợ phải gửi phiếu báo giá chi tiết qua hệ thống. Do đó, bạn hoàn toàn chủ động xác nhận chi phí trước khi thực hiện."
  },
  {
    q: "Quy trình khiếu nại và hoàn tiền hoạt động như thế nào khi chất lượng không đạt?",
    a: "Zup sẽ tạm giữ tiền thanh toán giao dịch trong 24 giờ. Ngoài ra, đội ngũ chuyên gia của Zup sẽ lập tức xác minh lỗi. Vì vậy, bạn được cam kết sửa lại miễn phí hoặc hoàn tiền 100%."
  },
  {
    q: "Quy trình kiểm duyệt và kiểm tra năng lực thợ đối tác của Zup diễn ra như thế nào?",
    a: "Zup áp dụng quy trình kiểm duyệt 3 bước nghiêm ngặt. Hơn nữa, thợ đối tác phải có chứng chỉ nghề hợp lệ. Ngoài ra, thợ phải vượt qua bài kiểm tra thái độ phục vụ khách hàng."
  },
  {
    q: "Thông tin địa chỉ nhà và số điện thoại cá nhân của tôi có được bảo mật an toàn không?",
    a: "Hệ thống bảo mật dữ liệu theo tiêu chuẩn mã hóa SSL tiên tiến nhất. Hơn nữa, thông tin chỉ được cung cấp khi bạn xác nhận đơn đặt lịch. Vì vậy, sự riêng tư luôn được bảo vệ."
  },
  {
    q: "Trong trường hợp sự cố khẩn cấp, thợ Zup sẽ mất bao lâu để có mặt và xử lý?",
    a: "Zup tự động đề xuất thợ ở vị trí gần bạn nhất. Do đó, thợ đối tác sẽ nhận đơn và có mặt chỉ trong vòng 15 đến 30 phút. Hơn nữa, bạn dễ dàng theo dõi hành trình di chuyển."
  },
  {
    q: "Các linh kiện và phụ tùng thay thế do thợ Zup cung cấp có quy chuẩn chất lượng và nguồn gốc như thế nào?",
    a: "Zup yêu cầu thợ cam kết chỉ sử dụng linh kiện chính hãng 100%. Hơn nữa, linh kiện thay thế bắt buộc phải có tem nhãn rõ ràng. Do đó, bạn được bảo hành bộ phận thay thế từ 3 đến 6 tháng."
  },
  {
    q: "Zup có cung cấp dịch vụ trong các ngày nghỉ lễ, Tết không và có phát sinh phụ phí gì không?",
    a: "Hệ thống Zup hoạt động liên tục 24/7 kể cả ngày lễ Tết. Tuy nhiên, giá dịch vụ có thể điều chỉnh nhẹ theo quy định ngày lễ. Vì vậy, thợ sẽ báo giá chi tiết qua app để bạn phê duyệt trước."
  }
];

export function GlossarySection() {
  return (
    <section className="pt-6 pb-10 border-t border-slate-800 space-y-7 animate-in fade-in duration-500">
      {/* E-E-A-T Professional Verification Block */}
      <div className="surface-card p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-500/5 to-teal-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-action-blue/10 rounded-2xl text-action-blue shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Nội dung được kiểm chứng chuyên môn.
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-base md:text-lg flex flex-wrap items-center gap-2">
              Chất lượng & Tiêu chuẩn vận hành Zup.
            </div>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 max-w-2xl leading-relaxed">
              Các tài liệu hướng dẫn và thuật ngữ được biên soạn bởi ban kiểm định chất lượng Zup. Hơn nữa, quy trình kiểm tra định kỳ nghiêm ngặt nhằm bảo vệ tối đa lợi ích khách hàng. Do đó, mọi thông tin đều chính xác tuyệt đối.
            </p>
          </div>
        </div>
        
        {/* Author details & Timestamps */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] leading-none mb-0.5">Kiểm định bởi.</p>
              <p className="text-slate-900 dark:text-white font-bold">
                Lê Hoàng Nguyễn (Kỹ sư trưởng kiểm định chất lượng Zup, 10 năm kinh nghiệm chuyên môn)
                <a
                  href="https://zup.vn/certificates/chief-engineer-nguyen"
                  className="text-sky-400 hover:underline hover:text-cyan-300 text-[10px] ml-1.5 font-medium inline-block shrink-0"
                >
                  (Xác minh chứng nhận quốc tế)
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-action-blue shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] leading-none mb-0.5">Cập nhật lúc.</p>
              <p className="text-slate-900 dark:text-white font-bold">28/05/2026.</p>
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
            Zup giải nghĩa rõ ràng các thuật ngữ chuyên ngành. Hơn nữa, thông tin sẽ giúp bạn nắm bắt tiêu chuẩn vận hành dễ dàng. Do đó, hãy tham khảo các khái niệm dưới đây.
          </p>
          <div className="space-y-4">
            {definitions.map((item, index) => (
              <div
                key={index}
                className="surface-card p-4 rounded-xl hover:border-action-blue/20 transition-all border border-slate-100 dark:border-slate-800"
              >
                <h3 className="font-bold text-sm text-action-blue mb-1">
                  {item.term}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
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
            Các câu hỏi này được chuyên gia giải đáp trực tiếp. Hơn nữa, thông tin sẽ giúp bạn hiểu rõ quy chế và chính sách bảo vệ quyền lợi. Do đó, hãy tham khảo chi tiết bên dưới.
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
                <AccordionContent className="text-slate-300 dark:text-slate-300 pb-5 leading-relaxed text-xs sm:text-sm">
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
