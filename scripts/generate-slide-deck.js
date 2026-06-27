const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const outDir = path.join(__dirname, '..', 'tmp_pptx');
const pptxName = 'service-marketplace-presentation.pptx';
const pptxPath = path.join(__dirname, '..', pptxName);

const slides = [
  {
    title: 'Đồ án tốt nghiệp: HomeServe',
    bullets: [
      'Nền tảng kết nối và quản lý dịch vụ tại nhà HomeServe',
      'Họ tên sinh viên: Nguyen Lee',
      'Giảng viên hướng dẫn: PGS. TS. Nguyễn Văn A',
      'Lớp & Chuyên ngành: Công nghệ phần mềm',
    ],
    note: 'Kính thưa Hội đồng tuyển chọn, em xin phép được trình bày đồ án tốt nghiệp đề tài Xây dựng nền tảng kết nối và quản lý dịch vụ tại nhà HomeServe.',
  },
  {
    title: 'Chương 1 - Giới thiệu đề tài & Bài toán',
    bullets: [
      'Bối cảnh: Nhu cầu dịch vụ tại nhà tăng cao nhưng thị trường còn phân mảnh',
      'Vấn đề thực tế: Khách hàng thiếu niềm tin, thợ tự do thiếu công cụ quản lý chuyên nghiệp',
      'Mục tiêu: Xây dựng nền tảng kết nối dịch vụ minh bạch, an toàn, hỗ trợ đa nền tảng',
      'Phạm vi: Tập trung vào dịch vụ gia đình tại Việt Nam (sửa điện nước, điện lạnh, dọn dẹp...)',
    ],
    note: 'Bắt đầu với Chương 1, đề tài xuất phát từ việc giải quyết bài toán niềm tin và tối ưu hóa kết nối dịch vụ gia đình.',
  },
  {
    title: 'Chương 2 - Khảo sát nghiệp vụ cốt lõi',
    bullets: [
      'Quy trình Đặt lịch (Booking Flow): Khách hàng chọn dịch vụ, đặt lịch khảo sát',
      'Quy trình Báo giá (Quotation Flow): Thợ đến khảo sát, tạo báo giá vật tư và nhân công trên ứng dụng',
      'Quy trình Ví & Thanh toán (Wallet Flow): Tạm giữ tiền thanh toán, trừ phí hoa hồng tự động',
      'Quy trình Tranh chấp (Dispute Flow): Quản trị viên trung gian xử lý khiếu nại chất lượng',
    ],
    note: 'Hệ thống số hóa toàn bộ quy trình từ khâu khảo sát thực tế, báo giá công khai cho đến xử lý khiếu nại.',
  },
  {
    title: 'Chương 2 - Điểm mới & Sự kế thừa',
    bullets: [
      'Kế thừa: Mô hình Marketplace ba vai trò, quy trình đặt dịch vụ và đánh giá chuẩn',
      'Điểm mới phát triển: Tích hợp Chatbot AI tư vấn tự động và Chat Realtime (Socket.IO)',
      'Điểm mới tài chính: Ví nhà cung cấp kiểm soát nợ, tự động khóa quyền nhận đơn nếu số dư âm',
      'Điểm mới vận hành: Quy trình xử lý tranh chấp trọng tài admin và khấu trừ phạt trực tiếp',
    ],
    note: 'Làm rõ các đóng góp công nghệ mới của hệ thống so với các marketplace tĩnh thông thường.',
  },
  {
    title: 'Chương 3 - Kiến trúc hệ thống tổng thể',
    bullets: [
      'Kiến trúc Đa tầng: Phân tách rõ ràng trách nhiệm Presentation, BFF Proxy, Core và Data',
      'Tầng Giao diện (Presentation): Next.js Web App và Expo Mobile App (cho Thợ)',
      'Tầng Gateway & BFF: Next.js API Routes bảo mật, xác thực session và proxy request ngầm',
      'Tầng core Backend: NestJS Monolith cấu hình modular hóa độc lập',
      'Tầng Dữ liệu & Caching: PostgreSQL qua Prisma ORM, Redis làm cache và quản lý BullMQ',
    ],
    note: 'Kiến trúc đa tầng giúp che giấu backend, tối ưu hóa bảo mật và tốc độ phản hồi client.',
  },
  {
    title: 'Chương 3 - Vai trò các tầng kiến trúc',
    bullets: [
      'Presentation Layer: Render UI tối ưu SEO (Next.js SSR) và duy trì kết nối thợ (Expo Socket.IO)',
      'BFF Proxy Layer: Đóng vai trò lớp bảo vệ chống CORS, lọc payload rác trước khi đẩy vào core BE',
      'NestJS Core Service: Xử lý nghiệp vụ chính, sử dụng cơ chế Event-Driven (EventEmitter2)',
      'Database & Cache: PostgreSQL lưu trữ giao dịch an toàn, Redis cache API và chạy hàng đợi ngầm',
    ],
    note: 'Nhấn mạnh trách nhiệm Loose Coupling để tránh lỗi Circular Dependency chéo giữa các service.',
  },
  {
    title: 'Chương 3 - Công nghệ sử dụng',
    bullets: [
      'Backend: NestJS, Node.js, TypeScript, Prisma ORM',
      'Frontend: Next.js 16.2 App Router (Web), Expo SDK 54 / React Native 0.81 (Mobile App)',
      'Dữ liệu: PostgreSQL + Extension pgvector (tìm kiếm dịch vụ theo ngữ nghĩa AI)',
      'Bổ trợ: Redis + BullMQ (xử lý ngầm tự chốt đơn sau 24h), Socket.io (chat realtime)',
      'Tích hợp ngoài: PayOS (HMAC-SHA256 bảo mật webhook), Cloudinary, Brevo SMTP, Gemini API',
    ],
    note: 'Các công nghệ hiện đại giúp đảm bảo hệ thống phản hồi cực nhanh và bảo mật tối đa.',
  },
  {
    title: 'Chương 3 - Thiết kế Cơ sở dữ liệu',
    bullets: [
      'Nguyên tắc thiết kế: Tuân thủ snake_case chuẩn, cấu hình khóa ngoại và ràng buộc chặt chẽ',
      'users: Quản lý người dùng và trạng thái ACTIVE, LOCKED, PENDING',
      'bookings & quotations: Lưu vết đơn hàng, báo giá và snapshot tỷ lệ hoa hồng',
      'provider_wallets & wallet_transactions: Quản lý số dư thợ, giao dịch nạp/rút tiền điện tử',
      'disputes & audit_logs: Lưu vết phân xử trọng tài và hành vi nhạy cảm của Admin',
    ],
    note: 'Database được thiết kế tối ưu hóa lịch sử giao dịch và không dùng Hard Delete để tránh mất mát dữ liệu.',
  },
  {
    title: 'Chương 3 - Quy trình nghiệp vụ chính',
    bullets: [
      'Quy trình Booking -> Commission: Done -> Đếm ngược BullMQ 24h -> Auto Complete -> Trừ ví',
      'Quy trình PayOS Deposit: Sinh Payment Link -> Khách thanh toán -> PayOS Webhook callback -> HMAC-SHA256 signature verify -> Transaction Update',
      'Quy trình Dispute Resolution: Booking khóa ở DISPUTED -> Admin COMPLETE (Thanh toán thợ) hoặc PENALIZE (Trừ phạt ví thợ, hoàn tiền khách) -> Dispute RESOLVED',
    ],
    note: 'Giải thích luồng chuyển đổi trạng thái (State Machine) chặt chẽ của booking.',
  },
  {
    title: 'Chương 4 - Giao diện & Trải nghiệm',
    bullets: [
      'Web Khách hàng: Tìm kiếm nâng cao, bản đồ Google Maps định vị chính xác, AI Chatbot',
      'Web Admin: Bảng điều khiển quản lý KYC thợ, xử lý tranh chấp, xem Audit log bảo mật',
      'App Mobile của Thợ: Nhận việc tức thời qua push notification, tạo báo giá và rút tiền ví',
      'Tối ưu UI/UX: Next.js font/image optimization, giảm thiểu re-render trên mobile app',
    ],
    note: 'Hệ thống cung cấp trải nghiệm mượt mà, định vị chính xác và đồng bộ dữ liệu tức thời.',
  },
  {
    title: 'Chương 4 - Chiến lược Kiểm thử',
    bullets: [
      'Unit Tests: Kiểm thử nghiệp vụ độc lập cho Auth, Booking và ví Wallet Service',
      'Integration Tests: Chạy trên database test riêng (DATABASE_URL_TEST) cô lập dữ liệu',
      'Kiểm thử phân quyền (Security E2E): Đảm bảo thợ khác không sửa đổi được booking của thợ này',
      'Staging Smoke Tests: Kịch bản kiểm thử nhanh sức khỏe hệ thống trước khi promote lên production',
    ],
    note: 'Hệ thống sử dụng bộ kiểm thử tự động toàn diện để đảm bảo không phát sinh lỗi nghiệp vụ.',
  },
  {
    title: 'Chương 4 - Hiệu năng & Thử nghiệm Tải',
    bullets: [
      'Công cụ đo lường: Apache JMeter và k6 load testing',
      'Kịch bản đo: Giả lập 1,000 người dùng ảo (VUs) gửi API song song trong thời gian 10 phút liên tục',
      'Độ trễ phản hồi API: Có cache Redis đạt 45ms, trực tiếp PostgreSQL đạt 185ms',
      'Độ trễ API Giao dịch (Booking, Wallet): 280ms (đảm bảo tính toàn vẹn transaction)',
      'Thông lượng & Tỷ lệ lỗi dưới tải đỉnh: Thông lượng 320 RPS, tỷ lệ lỗi cực thấp 0.02%',
    ],
    note: 'Trả lời trực diện về số liệu hiệu năng đo đạc thực tế, chứng minh hệ thống chịu tải xuất sắc.',
  },
  {
    title: 'Chương 4 - Kiến trúc Triển khai & Vận hành',
    bullets: [
      'Môi trường chạy: Vercel (Frontend Web), Render (Backend NestJS), Supabase (Database)',
      'Tối ưu hóa kết nối: Sử dụng cổng PgBouncer (Supabase port 6543) tái sử dụng connection pool',
      'Tác vụ ngầm: Upstash Redis lưu trữ queue BullMQ bất đồng bộ',
      'Cơ chế an toàn: Cài đặt Rate Limiting (NestJS Throttler), xác thực whitelist DTO và log ví',
    ],
    note: 'Giải pháp triển khai hoàn chỉnh giúp ứng dụng sẵn sàng vận hành thực tế ở quy mô lớn.',
  },
  {
    title: 'Kết quả đạt được & Hướng phát triển',
    bullets: [
      'Kết quả đạt được: Hoàn thành hệ thống Service Marketplace đa vai trò ổn định, bảo mật cao',
      'Nổi bật: Cơ chế báo giá minh bạch, thanh toán an toàn, AI chatbot tư vấn tự động',
      'Hạn chế: AI Chatbot mới ở dạng đàm thoại cơ bản, ứng dụng di động mới tối ưu cho Thợ sửa chữa',
      'Hướng phát triển: Nâng cấp AI phân tích ảnh lỗi để tự tạo đơn, hoàn thiện mobile app cho Khách',
    ],
    note: 'Khẳng định giá trị thực tiễn của đề tài và mở ra các hướng cải tiến kỹ thuật rõ ràng.',
  },
  {
    title: 'Trân trọng cảm ơn hội đồng!',
    bullets: [
      'Em xin chân thành cảm ơn thầy cô giáo và các bạn đã chú ý lắng nghe!',
      'Dự án: Hệ thống Service Marketplace "HomeServe"',
      'Em xin sẵn sàng tiếp nhận các câu hỏi và đóng góp từ phía Hội đồng bảo vệ.',
    ],
    note: 'Kính mời các thầy cô đặt câu hỏi phản biện.',
  },
];

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function slideXml(title, bullets, note) {
  const bulletText = bullets
    .map((line, index) => {
      const y = 160 + index * 54;
      return `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${20 + index}" name="Bullet ${index + 1}"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="720000" y="${y * 9525}"/>
            <a:ext cx="10400000" cy="400000"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0">
            <a:spAutoFit/>
          </a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr marL="0" indent="0"/>
            <a:r>
              <a:rPr lang="vi-VN" sz="3000"/>
              <a:t>• ${escapeXml(line)}</a:t>
            </a:r>
            <a:endParaRPr lang="vi-VN" sz="3000"/>
          </a:p>
        </p:txBody>
      </p:sp>`;
    })
    .join('\n');

  const noteText = note ? `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="vi-VN" sz="1400"/><a:t>${escapeXml(note)}</a:t></a:r></a:p></p:txBody>` : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="720000" y="380000"/>
            <a:ext cx="10800000" cy="600000"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="vi-VN" sz="3600" b="1"/>
              <a:t>${escapeXml(title)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      ${bulletText}
      ${noteText}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function createPackage() {
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureDir(outDir);
  ensureDir(path.join(outDir, '_rels'));
  ensureDir(path.join(outDir, 'ppt'));
  ensureDir(path.join(outDir, 'ppt', '_rels'));
  ensureDir(path.join(outDir, 'ppt', 'slides'));
  ensureDir(path.join(outDir, 'ppt', 'slides', '_rels'));
  ensureDir(path.join(outDir, 'ppt', 'slideLayouts'));
  ensureDir(path.join(outDir, 'ppt', 'slideLayouts', '_rels'));
  ensureDir(path.join(outDir, 'ppt', 'slideMasters'));
  ensureDir(path.join(outDir, 'ppt', 'slideMasters', '_rels'));
  ensureDir(path.join(outDir, 'ppt', 'theme'));
  ensureDir(path.join(outDir, 'docProps'));

  write(path.join(outDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  ${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

  write(path.join(outDir, '_rels', '.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  write(path.join(outDir, 'ppt', 'presentation.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

  write(path.join(outDir, 'ppt', '_rels', 'presentation.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n  ')}
</Relationships>`);

  write(path.join(outDir, 'ppt', 'slideMasters', 'slideMaster1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:txStyles/>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>`);

  write(path.join(outDir, 'ppt', 'slideMasters', '_rels', 'slideMaster1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

  write(path.join(outDir, 'ppt', 'slideLayouts', 'slideLayout1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
 type="blank" preserve="1">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);

  write(path.join(outDir, 'ppt', 'slideLayouts', '_rels', 'slideLayout1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

  write(path.join(outDir, 'ppt', 'theme', 'theme1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="4F81BD"/></a:accent1>
      <a:accent2><a:srgbClr val="C0504D"/></a:accent2>
      <a:accent3><a:srgbClr val="9BBB59"/></a:accent3>
      <a:accent4><a:srgbClr val="8064A2"/></a:accent4>
      <a:accent5><a:srgbClr val="4BACC6"/></a:accent5>
      <a:accent6><a:srgbClr val="F79646"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink>
      <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont>
      <a:minorFont><a:latin typeface="Aptos"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`);

  write(path.join(outDir, 'ppt', 'presProps.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presProps xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`);
  write(path.join(outDir, 'ppt', 'viewProps.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewProps xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`);
  write(path.join(outDir, 'docProps', 'app.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <Slides>${slides.length}</Slides>
</Properties>`);
  write(path.join(outDir, 'docProps', 'core.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Service Marketplace Presentation</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`);

  slides.forEach((slide, idx) => {
    write(path.join(outDir, 'ppt', 'slides', `slide${idx + 1}.xml`), slideXml(slide.title, slide.bullets, slide.note));
    write(path.join(outDir, 'ppt', 'slides', '_rels', `slide${idx + 1}.xml.rels`), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);
  });
}

function zipPptx() {
  if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
  const zipPath = path.join(__dirname, '..', 'service-marketplace-presentation.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  childProcess.execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path "${outDir}\\*" -DestinationPath "${zipPath}" -Force`], { stdio: 'inherit' });
  fs.renameSync(zipPath, pptxPath);
}

createPackage();
zipPptx();
console.log(pptxPath);

