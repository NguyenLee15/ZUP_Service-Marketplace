'use client';

import React from 'react';
import { Book, HelpCircle, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    q: "Các linh kiện và phụ tùng thay thế do thợ Zup cung cấp có quy chuẩn chất lượng như thế nào?",
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
      {/* E-E-A-T Professional Verification Block — layout dọc gọn, không bị squeeze */}
      <div className="surface-card p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-sky-500/5 to-teal-500/5 space-y-4">
        {/* Header row: icon + tiêu đề */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-action-blue/10 rounded-xl text-action-blue shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block leading-none mb-1">
              Nội dung được kiểm chứng chuyên môn
            </span>
            <p className="font-bold text-white text-sm md:text-base leading-snug">
              Chất lượng &amp; Tiêu chuẩn vận hành Zup
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Các tài liệu hướng dẫn và thuật ngữ được biên soạn bởi ban kiểm định chất lượng Zup.
          Hơn nữa, quy trình kiểm tra định kỳ nghiêm ngặt nhằm bảo vệ tối đa lợi ích khách hàng.
          Do đó, mọi thông tin đều chính xác tuyệt đối.
        </p>

        {/* Reviewer + Date — 1 hàng chip, không wrap xấu */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-500">Kiểm định:</span>
            <span className="text-slate-300 font-semibold">Lê Hoàng Nguyễn</span>
            <span className="text-slate-500">— Kỹ sư trưởng Zup</span>
            <a
              href="https://zup.vn/certificates/chief-engineer-nguyen"
              className="text-sky-400 hover:underline ml-1"
            >
              ↗ Xác minh
            </a>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-action-blue shrink-0" />
            <span className="text-slate-500">Cập nhật:</span>
            <time className="text-emerald-400 font-semibold" dateTime="2026-05-28">28/05/2026</time>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Glossary & Terms Definitions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Book className="w-5 h-5 text-action-blue shrink-0" />
            <h2 id="thuat-ngu-dich-vu" className="text-lg md:text-xl font-bold text-white">
              Thuật ngữ &amp; Khái niệm dịch vụ
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Zup giải nghĩa rõ ràng các thuật ngữ chuyên ngành để bạn nắm bắt tiêu chuẩn vận hành dễ dàng.
          </p>
          {/* List style thay vì 3 card riêng biệt */}
          <ul className="space-y-3">
            {definitions.map((item, index) => (
              <li key={index} className="border-l-2 border-action-blue/40 pl-4 py-1">
                <h3 className="font-bold text-sm text-action-blue mb-0.5">{item.term}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.definition}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Direct Q&A */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-action-blue shrink-0" />
            <h2 id="giai-dap-truc-tiep" className="text-lg md:text-xl font-bold text-white">
              Giải đáp trực tiếp từ chuyên gia Zup
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Các câu hỏi được chuyên gia giải đáp trực tiếp về quy chế và chính sách bảo vệ quyền lợi.
          </p>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {directAnswers.map((item, index) => (
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
        </div>
      </div>
    </section>
  );
}
