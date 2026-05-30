import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DỌN DẸP TOÀN BỘ DỮ LIỆU CŨ TRÊN DATABASE ===');
  await prisma.review.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.disputeEvidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.bookingAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceImage.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.providerWallet.deleteMany();
  await prisma.kycProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.otpAttempt.deleteMany();
  await prisma.user.deleteMany();

  console.log('=== KHỞI TẠO BỘ DỮ LIỆU PREMIUM CHUẨN THỊ TRƯỜNG ===');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Tạo Users (Admin, 5 Thợ chuyên môn sâu, 1 Khách hàng mẫu)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      password: passwordHash,
      fullName: 'Quản Trị Viên Hệ Thống',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const provider1 = await prisma.user.create({
    data: {
      email: 'provider1@demo.com',
      password: passwordHash,
      fullName: 'Nguyễn Đức Cường - Chuyên Gia Điện Lạnh',
      phone: '0901234561',
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerified: true,
      kycProfiles: {
        create: {
          cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
          status: 'APPROVED',
        },
      },
      providerWallet: { create: { balance: 1500000 } },
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      email: 'provider2@demo.com',
      password: passwordHash,
      fullName: 'Trần Văn Hải - Kỹ Sư Điện Nước 24H',
      phone: '0901234562',
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerified: true,
      kycProfiles: {
        create: {
          cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
          status: 'APPROVED',
        },
      },
      providerWallet: { create: { balance: 800000 } },
    },
  });

  const provider3 = await prisma.user.create({
    data: {
      email: 'provider3@demo.com',
      password: passwordHash,
      fullName: 'Lê Thanh Sơn - Kỹ Thuật Viên Thiết Bị Điện Máy',
      phone: '0901234563',
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerified: true,
      kycProfiles: {
        create: {
          cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&q=80',
          status: 'APPROVED',
        },
      },
      providerWallet: { create: { balance: 2000000 } },
    },
  });

  const provider4 = await prisma.user.create({
    data: {
      email: 'provider4@demo.com',
      password: passwordHash,
      fullName: 'Hương Giang - Viện Trị Liệu & Massage An Nhiên',
      phone: '0901234564',
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerified: true,
      kycProfiles: {
        create: {
          cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
          status: 'APPROVED',
        },
      },
      providerWallet: { create: { balance: 500000 } },
    },
  });

  const provider5 = await prisma.user.create({
    data: {
      email: 'provider5@demo.com',
      password: passwordHash,
      fullName: 'CleanHouse - Công Ty Vệ Sinh Đô Thị',
      phone: '0901234565',
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerified: true,
      kycProfiles: {
        create: {
          cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
          status: 'APPROVED',
        },
      },
      providerWallet: { create: { balance: 1200000 } },
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      password: passwordHash,
      fullName: 'Nguyễn Văn Khách',
      phone: '0988888888',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      addresses: {
        create: {
          province: 'Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          addressDetail: '123 Lê Lợi',
          latitude: 10.7769,
          longitude: 106.7009,
          isDefault: true,
        },
      },
    },
  });

  // 2. Tạo 3 Mốc lớn Siêu ứng dụng & các danh mục con (Level 2)
  console.log('Khởi tạo danh mục siêu ứng dụng...');
  
  // Mốc 1: Dịch vụ Kỹ thuật & Sửa chữa
  const catTech = await prisma.serviceCategory.create({
    data: { name: 'Dịch vụ Sửa chữa & Kỹ thuật', level: 1 },
  });
  const subDienNuoc = await prisma.serviceCategory.create({
    data: { name: 'Sửa chữa Điện nước', level: 2, parentId: catTech.id },
  });
  const subDienLanh = await prisma.serviceCategory.create({
    data: { name: 'Sửa chữa Điện lạnh', level: 2, parentId: catTech.id },
  });
  const subGiaDung = await prisma.serviceCategory.create({
    data: { name: 'Sửa thiết bị gia dụng', level: 2, parentId: catTech.id },
  });
  const subIT = await prisma.serviceCategory.create({
    data: { name: 'Sửa thiết bị công nghệ', level: 2, parentId: catTech.id },
  });

  // Mốc 2: Vệ sinh & Chăm sóc không gian sống
  const catClean = await prisma.serviceCategory.create({
    data: { name: 'Vệ sinh & Chăm sóc Nhà cửa', level: 1 },
  });
  const subDonNha = await prisma.serviceCategory.create({
    data: { name: 'Dọn dẹp nhà cửa', level: 2, parentId: catClean.id },
  });
  const subSofa = await prisma.serviceCategory.create({
    data: { name: 'Giặt Sofa, Đệm, Rèm', level: 2, parentId: catClean.id },
  });
  const subPest = await prisma.serviceCategory.create({
    data: { name: 'Diệt côn trùng & Khử trùng', level: 2, parentId: catClean.id },
  });

  // Mốc 3: Làm đẹp & Sức khỏe tại nhà
  const catWellness = await prisma.serviceCategory.create({
    data: { name: 'Sức khỏe & Làm đẹp tại nhà', level: 1 },
  });
  const subMassage = await prisma.serviceCategory.create({
    data: { name: 'Massage trị liệu', level: 2, parentId: catWellness.id },
  });
  const subHair = await prisma.serviceCategory.create({
    data: { name: 'Cắt tóc & Làm móng tại nhà', level: 2, parentId: catWellness.id },
  });
  const subMakeup = await prisma.serviceCategory.create({
    data: { name: 'Trang điểm & Làm đẹp', level: 2, parentId: catWellness.id },
  });

  // 3. Tạo các Dịch vụ mẫu chuẩn thực tế Việt Nam kèm Dịch vụ con (ServiceItems)
  console.log('Khởi tạo dịch vụ thực tế kèm dịch vụ con...');

  // --- Dịch vụ 1: Vệ sinh máy lạnh treo tường (Thợ Cường) ---
  const sACClean = await prisma.service.create({
    data: {
      providerId: provider1.id,
      categoryId: subDienLanh.id,
      name: 'Vệ sinh máy lạnh treo tường chuyên sâu',
      description: 'Dịch vụ vệ sinh dàn nóng và dàn lạnh máy lạnh treo tường từ 1HP - 3HP. Sử dụng vòi xịt áp lực cao sạch sâu bẩn thỉu bụi bặm, hỗ trợ thông ống thoát nước thải, bảo dưỡng bôi dầu block dàn nóng. Cam kết hiệu năng lạnh sâu rõ rệt.',
      referencePrice: 150000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 24,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
          cloudinaryId: 'seed_ac_clean',
        },
      },
      items: {
        create: [
          { name: 'Vệ sinh máy lạnh treo tường công suất 1.0HP - 1.5HP', unit: 'Bộ', price: 150000 },
          { name: 'Vệ sinh máy lạnh treo tường công suất 2.0HP - 2.5HP', unit: 'Bộ', price: 180000 },
          { name: 'Khử khuẩn sinh học dàn lạnh diệt nấm mốc nấm mầm', unit: 'Máy', price: 50000 },
        ],
      },
    },
  });

  // --- Dịch vụ 2: Bơm gas máy lạnh treo tường (Thợ Cường) ---
  const sACGas = await prisma.service.create({
    data: {
      providerId: provider1.id,
      categoryId: subDienLanh.id,
      name: 'Bơm Gas máy lạnh bổ sung chuẩn R32 / R410A',
      description: 'Khắc phục ngay tình trạng máy lạnh chạy thổi gió nóng, đóng tuyết đường ống đồng. Kiểm tra rò rỉ khớp nối rắc co, đo áp suất gas đầu hút đầu đẩy bằng đồng hồ đo chuẩn kỹ thuật và bơm bổ sung đạt định mức nhà sản xuất.',
      referencePrice: 100000,
      status: 'ACTIVE',
      avgRating: 4.6,
      totalReviews: 12,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=800&q=80',
          cloudinaryId: 'seed_ac_gas',
        },
      },
      items: {
        create: [
          { name: 'Bơm nạp bổ sung Gas R32 / R410A bằng đồng hồ đo áp', unit: 'PSI', price: 2000 },
          { name: 'Nạp gas toàn phần trọn gói máy lạnh 1.0HP - 1.5HP', unit: 'Máy', price: 350000 },
          { name: 'Nạp gas toàn phần trọn gói máy lạnh 2.0HP - 2.5HP', unit: 'Máy', price: 450000 },
        ],
      },
    },
  });

  // --- Dịch vụ 3: Sửa chữa chập nhảy điện Aptomat (Thợ Hải) ---
  const sElec = await prisma.service.create({
    data: {
      providerId: provider2.id,
      categoryId: subDienNuoc.id,
      name: 'Dò tìm rò rỉ điện nhảy aptomat chập nguồn âm tường',
      description: 'Thợ điện nước chuyên nghiệp xử lý triệt để tình trạng nhảy CB không rõ nguyên nhân, chập nổ ổ cắm, mất điện từng vùng tại gia đình. Đo kiểm tra thông mạch, rò rỉ pha điện âm tường bằng megomet chuyên dụng.',
      referencePrice: 250000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 32,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
          cloudinaryId: 'seed_elec_leak',
        },
      },
      items: {
        create: [
          { name: 'Dò tìm vị trí chập điện cháy nổ hệ thống chôn âm', unit: 'Lần', price: 250000 },
          { name: 'Thay thế Aptomat tổng hoặc CB nhánh chập cháy', unit: 'Cái', price: 120000 },
          { name: 'Thay thế ổ cắm chập điện Panasonic chính hãng', unit: 'Cái', price: 70000 },
          { name: 'Lắp đặt đèn LED âm trần / đèn rọi ray bếp', unit: 'Bộ', price: 90000 },
        ],
      },
    },
  });

  // --- Dịch vụ 4: Thông tắc bồn cầu nghẹt (Thợ Hải) ---
  const sPlumb = await prisma.service.create({
    data: {
      providerId: provider2.id,
      categoryId: subDienNuoc.id,
      name: 'Thông bồn cầu chậu rửa bát cống thoát nghẹt',
      description: 'Thông tắc bồn cầu nghẹt giấy, nghẹt vật cứng, chậu rửa bát mỡ đóng bánh. Sử dụng công cụ máy nén khí áp lực cao hoặc máy lò xo chuyên nghiệp công nghệ mới không đục phá nền gạch, không mùi hôi.',
      referencePrice: 300000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 18,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
          cloudinaryId: 'seed_plumb_clog',
        },
      },
      items: {
        create: [
          { name: 'Thông bồn cầu nghẹt bằng súng nén áp suất khí', unit: 'Lượt', price: 350000 },
          { name: 'Thông đường ống thoát chậu rửa bát bằng máy lò xo', unit: 'Mét', price: 150000 },
          { name: 'Thay thế phao cơ xả nước bồn cầu hai nút nhấn', unit: 'Bộ', price: 220000 },
        ],
      },
    },
  });

  // --- Dịch vụ 5: Vệ sinh dọn dẹp nhà cửa theo giờ (Công ty CleanHouse) ---
  const sClean = await prisma.service.create({
    data: {
      providerId: provider5.id,
      categoryId: subDonNha.id,
      name: 'Dọn dẹp nhà cửa lau chùi sắp xếp theo giờ',
      description: 'Dịch vụ dọn nhà định kỳ, quét dọn, lau sàn, rửa chén bát, thay ga đệm chăn màn, lau kính căn hộ chung cư hoặc nhà phố. Nhân viên có hồ sơ tư pháp sạch sẽ, được đào tạo quy trình vệ sinh 5 sao, mang theo đầy đủ dụng cụ tẩy rửa.',
      referencePrice: 70000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 45,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
          cloudinaryId: 'seed_house_clean',
        },
      },
      items: {
        create: [
          { name: 'Ca dọn dẹp nhà cửa cơ bản theo giờ (Tối thiểu 3 tiếng)', unit: 'Giờ', price: 75000 },
          { name: 'Gói tổng vệ sinh nhà mới xây xong chùi bụi sơn vôi', unit: 'Mét vuông', price: 18000 },
          { name: 'Gói lau kính ban công và cửa kính lớn chung cư', unit: 'Tấm', price: 50000 },
        ],
      },
    },
  });

  // --- Dịch vụ 6: Giặt Sofa nệm rèm hơi nước nóng (Công ty CleanHouse) ---
  const sSofa = await prisma.service.create({
    data: {
      providerId: provider5.id,
      categoryId: subSofa.id,
      name: 'Giặt ghế Sofa Đệm bông ép Rèm cửa sấy khô tại chỗ',
      description: 'Giặt hấp loại bỏ 99% vi khuẩn, ẩm mốc, mùi mồ hôi bằng công nghệ hơi nước nóng phun hút sâu của Karcher (Đức). Sử dụng dung dịch tẩy rửa hữu cơ an toàn cho sức khỏe trẻ nhỏ và thú cưng.',
      referencePrice: 300000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 29,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80',
          cloudinaryId: 'seed_sofa_clean',
        },
      },
      items: {
        create: [
          { name: 'Giặt hơi nước nóng ghế Sofa vải nỉ góc chữ L dưới 2.5m', unit: 'Bộ', price: 350000 },
          { name: 'Giặt dưỡng sâu ghế Sofa da cao cấp phủ kem làm bóng', unit: 'Bộ', price: 450000 },
          { name: 'Giặt hơi nước khử trùng đệm cao su size King 1m8x2m', unit: 'Tấm', price: 300000 },
        ],
      },
    },
  });

  // --- Dịch vụ 7: Sửa board bếp từ đôi bếp ngoại (Thợ Sơn) ---
  const sAppliances = await prisma.service.create({
    data: {
      providerId: provider3.id,
      categoryId: subGiaDung.id,
      name: 'Sửa chữa bếp từ bếp hồng ngoại lỗi cắm nhảy aptomat',
      description: 'Khắc phục triệt để các lỗi bếp từ báo E0, E1, E2... không nóng, hỏng bàn phím cảm ứng, chập cháy nổ cầu chì IGBT. Linh kiện thay thế chính hãng có dán tem bảo hành từ 6 đến 12 tháng.',
      referencePrice: 200000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 14,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&q=80',
          cloudinaryId: 'seed_cooker_fix',
        },
      },
      items: {
        create: [
          { name: 'Sửa board mạch lỗi nguồn bếp từ đơn tại chỗ', unit: 'Lượt', price: 250000 },
          { name: 'Sửa lỗi không nhận nồi bếp từ đôi cao cấp của Đức/Ý', unit: 'Lượt', price: 450000 },
          { name: 'Thay thế mặt kính bếp từ chịu nhiệt bị nứt vỡ', unit: 'Cái', price: 1200000 },
        ],
      },
    },
  });

  // --- Dịch vụ 8: Cài Win và vệ sinh Laptop tận nơi (Thợ Sơn) ---
  const sIT = await prisma.service.create({
    data: {
      providerId: provider3.id,
      categoryId: subIT.id,
      name: 'Vệ sinh Laptop bôi keo MX4 & Cài Win tận nhà',
      description: 'Khắc phục máy tính chậm đơ, tự tắt nguồn do quá nóng. Kỹ thuật viên qua trực tiếp cài hệ điều hành Windows 10/11 sạch sẽ, bôi keo tản nhiệt ARCTIC MX-4 mát lạnh cho CPU/GPU và quét bụi quạt gió.',
      referencePrice: 150000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 21,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1588403194-611308249627?w=800&q=80',
          cloudinaryId: 'seed_pc_clean',
        },
      },
      items: {
        create: [
          { name: 'Vệ sinh tháo máy bôi keo tản nhiệt Laptop chuyên nghiệp', unit: 'Máy', price: 150000 },
          { name: 'Cài lại Windows 10/11 & Drivers & Office cơ bản', unit: 'Máy', price: 200000 },
          { name: 'Nâng cấp ổ cứng SSD siêu tốc 256GB chính hãng', unit: 'Chiếc', price: 550000 },
        ],
      },
    },
  });

  // --- Dịch vụ 9: Massage trị liệu vai gáy (Thợ Giang) ---
  const sMassage = await prisma.service.create({
    data: {
      providerId: provider4.id,
      categoryId: subMassage.id,
      name: 'Massage bấm huyệt trị liệu đau mỏi vai gáy cột sống',
      description: 'Xua tan tức thì cơn đau mỏi, tê bì tay chân do ngồi văn phòng sai tư thế. Liệu trình bấm huyệt khai thông kinh lạc cổ vai gáy sử dụng tinh dầu thảo dược thiên nhiên, kết hợp giác hơi đá nóng giãn cơ.',
      referencePrice: 250000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 38,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80',
          cloudinaryId: 'seed_massage',
        },
      },
      items: {
        create: [
          { name: 'Xoa bóp bấm huyệt thông kinh lạc vai gáy 60 phút', unit: 'Ca', price: 250000 },
          { name: 'Liệu trình massage body thải độc kết hợp đá nóng 90 phút', unit: 'Ca', price: 380000 },
          { name: 'Giác hơi cạo gió bằng bộ giác chân không an toàn', unit: 'Lượt', price: 80000 },
        ],
      },
    },
  });

  // --- Dịch vụ 10: Cắt tóc nam nữ tại nhà (Thợ Giang) ---
  const sHair = await prisma.service.create({
    data: {
      providerId: provider4.id,
      categoryId: subHair.id,
      name: 'Cắt tóc tạo kiểu nam nữ chuẩn Salon tại nhà',
      description: 'Dịch vụ tạo mẫu tóc tận nơi dành cho gia đình bận rộn, người lớn tuổi hoặc trẻ em sợ tiệm tóc. Stylist chuyên nghiệp mang theo đầy đủ kéo, gương di động, khăn choàng, đảm bảo gọn gàng sạch sẽ không để lại vụn tóc.',
      referencePrice: 80000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 16,
      images: {
        create: {
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
          cloudinaryId: 'seed_hair_cut',
        },
      },
      items: {
        create: [
          { name: 'Cắt tóc nam tạo kiểu Mohican / Layer sấy Wax vuốt nếp', unit: 'Đầu', price: 80000 },
          { name: 'Cắt tạo kiểu tóc nữ Layer / Bob Hàn Quốc thời thượng', unit: 'Đầu', price: 150000 },
          { name: 'Ráy tai ráy ướt ráy khô thư giãn nghệ thuật', unit: 'Bộ', price: 60000 },
        ],
      },
    },
  });

  // 4. Tạo các booking mẫu lịch sử (Tích hợp luôn các bookingItems)
  console.log('Khởi tạo booking mẫu có chứa dịch vụ con...');
  
  // Booking 1: Khách đặt vệ sinh máy lạnh (Trạng thái DONE, thợ Cường làm)
  const b1 = await prisma.booking.create({
    data: {
      bookingCode: 'BK764129',
      customerId: customer.id,
      providerId: provider1.id,
      serviceId: sACClean.id,
      description: 'Cần vệ sinh 2 máy treo tường gấp ở chung cư',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressDetail: '123 Lê Lợi, Căn hộ A102',
      desiredTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
      status: 'DONE',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      autoCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      bookingItems: {
        create: [
          {
            name: 'Vệ sinh máy lạnh treo tường công suất 1.0HP - 1.5HP',
            unit: 'Bộ',
            quantity: 2,
            priceSnapshot: 150000,
          },
        ],
      },
      quotation: {
        create: {
          actualPrice: 300000,
          commissionRateSnapshot: 10,
          estimatedTime: '1 giờ 30 phút',
          note: 'Đã hoàn thành sạch sẽ, thợ làm kỹ',
          quotationItems: {
            create: [
              {
                name: 'Vệ sinh máy lạnh treo tường công suất 1.0HP - 1.5HP',
                unit: 'Bộ',
                quantity: 2,
                price: 150000,
              },
            ],
          },
        },
      },
    },
  });

  // Booking 2: Khách đặt sửa chập điện (Trạng thái IN_PROGRESS, thợ Hải làm)
  await prisma.booking.create({
    data: {
      bookingCode: 'BK924856',
      customerId: customer.id,
      providerId: provider2.id,
      serviceId: sElec.id,
      description: 'Phòng bếp bị nhảy CB liên tục khi cắm lò vi sóng',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressDetail: '123 Lê Lợi, Nhà phố số 4',
      desiredTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // ngày mai
      status: 'IN_PROGRESS',
      bookingItems: {
        create: [
          {
            name: 'Dò tìm vị trí chập điện cháy nổ hệ thống chôn âm',
            unit: 'Lần',
            quantity: 1,
            priceSnapshot: 250000,
          },
        ],
      },
      quotation: {
        create: {
          actualPrice: 370000,
          commissionRateSnapshot: 10,
          estimatedTime: '2 giờ',
          note: 'Đã phát sinh chập đường dây ổ cắm bếp, thay mới ổ cắm an toàn',
          quotationItems: {
            create: [
              {
                name: 'Dò tìm vị trí chập điện cháy nổ hệ thống chôn âm',
                unit: 'Lần',
                quantity: 1,
                price: 250000,
              },
              {
                name: 'Thay thế ổ cắm chập điện Panasonic chính hãng (Phát sinh)',
                unit: 'Cái',
                quantity: 1,
                price: 120000, // Thay thế kèm công lắp
              },
            ],
          },
        },
      },
    },
  });

  console.log('=== SEED DỮ LIỆU ĐA DỊCH VỤ THÀNH CÔNG ===');
  console.log('Tài khoản Test:');
  console.log('* Admin: admin@system.com / password123');
  console.log('* Khách hàng: customer@demo.com / password123');
  console.log('* Thợ Điện Lạnh (Cường): provider1@demo.com / password123');
  console.log('* Thợ Điện Nước (Hải): provider2@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
