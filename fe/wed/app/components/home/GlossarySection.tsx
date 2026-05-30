'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <section className="pt-6 pb-10 border-t border-slate-800 space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2.5">
        <HelpCircle className="w-5 h-5 text-action-blue shrink-0" />
        <h2 id="giai-dap-truc-tiep" className="text-lg md:text-xl font-bold text-white">
          Câu hỏi thường gặp
        </h2>
      </div>

      {/* 2-column FAQ grid để không bị quá dài theo chiều dọc */}
      <div className="grid md:grid-cols-2 gap-2">
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
      </div>

      {/* Hidden SEO metadata — giữ nguyên Thuật ngữ cho crawlers nhưng không hiển thị */}
      <dl className="sr-only" aria-hidden="true">
        <dt>Dịch vụ tại nhà (Home Services)</dt>
        <dd>Là mô hình cung cấp các tiện ích gia đình trực tiếp. Các dịch vụ sửa chữa hay vệ sinh đều được phục vụ tận nơi tiện lợi.</dd>
        <dt>Thợ xác thực (Verified Providers)</dt>
        <dd>Tất cả đối tác đều được kiểm duyệt chặt chẽ. Hồ sơ cá nhân (KYC) được xác minh minh bạch nhằm bảo đảm an toàn.</dd>
        <dt>Đặt lịch thông minh (Smart Booking)</dt>
        <dd>Quy trình kết nối thợ trực tuyến theo thời gian thực. Hệ thống tự động tìm thợ gần bạn nhất để tối ưu thời gian.</dd>
      </dl>
    </section>
  );
}
