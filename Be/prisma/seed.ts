import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DỌN DẸP TOÀN BỘ DỮ LIỆU CŨ TRÊN DATABASE ===');
  await prisma.review.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.manualDepositRequest.deleteMany();
  await prisma.featuredListing.deleteMany();
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
  await prisma.commissionConfig.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.chatbotSessionMessage.deleteMany();
  await prisma.chatbotSession.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.otpAttempt.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

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

  const staff = await prisma.user.create({
    data: {
      email: 'staff@demo.com',
      password: passwordHash,
      fullName: 'Nhân Viên Điều Phối Demo',
      phone: '0901234500',
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: true,
      permissions: [
        'user_view',
        'staff_view',
        'booking_view',
        'booking_cancel',
        'dispute_view',
        'dispute_resolve',
        'service_moderate',
        'wallet_deposit_manage',
        'wallet_withdrawal_manage',
        'audit_log_view',
      ],
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
          cccdFrontUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
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
          cccdFrontUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
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
          cccdFrontUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl:
            'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&q=80',
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
          cccdFrontUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl:
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
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
          cccdFrontUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          cccdBackUrl:
            'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
          portraitUrl:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
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

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@demo.com',
      password: passwordHash,
      fullName: 'Trần Minh Anh',
      phone: '0977777777',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      addresses: {
        create: [
          {
            label: 'Nhà riêng',
            province: 'Hồ Chí Minh',
            district: 'Quận 3',
            ward: 'Phường Võ Thị Sáu',
            addressDetail: '45 Nguyễn Đình Chiểu',
            latitude: 10.7829,
            longitude: 106.6891,
            isDefault: true,
          },
          {
            label: 'Văn phòng',
            province: 'Hồ Chí Minh',
            district: 'Quận Bình Thạnh',
            ward: 'Phường 25',
            addressDetail: 'Tòa nhà Pearl Plaza, 561A Điện Biên Phủ',
            latitude: 10.8012,
            longitude: 106.7184,
            isDefault: false,
          },
        ],
      },
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'commission_rate',
        value: JSON.stringify({ rate: 10 }),
      },
      {
        key: 'featured_daily_rate',
        value: '30000',
      },
    ],
  });

  await prisma.commissionConfig.create({
    data: {
      rate: 10,
      reason: 'Mức hoa hồng demo mặc định cho thị trường dịch vụ tại nhà',
      configuredBy: admin.id,
      effectiveFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Tạo 3 Mốc lớn Siêu ứng dụng & các danh mục con (Level 2)
  console.log('Khởi tạo danh mục siêu ứng dụng...');

  // 1. Sửa chữa & Kỹ thuật
  const catTech = await prisma.serviceCategory.create({
    data: { name: 'Sửa chữa & Kỹ thuật', level: 1 },
  });

  // 2. Vệ sinh & Không gian sống
  const catClean = await prisma.serviceCategory.create({
    data: { name: 'Vệ sinh & Không gian sống', level: 1 },
  });

  // 3. Sức khỏe & Làm đẹp
  const catWellness = await prisma.serviceCategory.create({
    data: { name: 'Sức khỏe & Làm đẹp', level: 1 },
  });

  // 4. Công nghệ & Thiết bị
  const catIT = await prisma.serviceCategory.create({
    data: { name: 'Công nghệ & Thiết bị', level: 1 },
  });

  // 5. Sự kiện & Nấu ăn
  const catEvent = await prisma.serviceCategory.create({
    data: { name: 'Sự kiện & Nấu ăn', level: 1 },
  });

  // 6. Mẹ & Bé
  const catMomBaby = await prisma.serviceCategory.create({
    data: { name: 'Mẹ & Bé', level: 1 },
  });

  // 7. Thú cưng
  const catPet = await prisma.serviceCategory.create({
    data: { name: 'Thú cưng', level: 1 },
  });

  // 8. Xe cộ & Vận chuyển
  const catTransport = await prisma.serviceCategory.create({
    data: { name: 'Xe cộ & Vận chuyển', level: 1 },
  });

  // 9. Tư vấn & Chuyên môn
  const catConsult = await prisma.serviceCategory.create({
    data: { name: 'Tư vấn & Chuyên môn', level: 1 },
  });

  // 3. Tạo các Dịch vụ mẫu chuẩn thực tế Việt Nam kèm Dịch vụ con (ServiceItems)
  console.log('Khởi tạo dịch vụ thực tế kèm dịch vụ con...');

  // --- Dịch vụ 1: Vệ sinh máy lạnh treo tường (Thợ Cường) ---
  const sACClean = await prisma.service.create({
    data: {
      providerId: provider1.id,
      categoryId: catTech.id,
      name: 'Vệ sinh máy lạnh treo tường chuyên sâu',
      description:
        'Dịch vụ vệ sinh dàn nóng và dàn lạnh máy lạnh treo tường từ 1HP - 3HP. Sử dụng vòi xịt áp lực cao sạch sâu bẩn thỉu bụi bặm, hỗ trợ thông ống thoát nước thải, bảo dưỡng bôi dầu block dàn nóng. Cam kết hiệu năng lạnh sâu rõ rệt.',
      referencePrice: 150000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 24,
      images: {
        create: {
          imageUrl: '/images/ac_cleaning.png',
          cloudinaryId: 'seed_ac_clean',
        },
      },
      items: {
        create: [
          {
            name: 'Vệ sinh máy lạnh treo tường công suất 1.0HP - 1.5HP',
            unit: 'Bộ',
            price: 150000,
          },
          {
            name: 'Vệ sinh máy lạnh treo tường công suất 2.0HP - 2.5HP',
            unit: 'Bộ',
            price: 180000,
          },
          {
            name: 'Khử khuẩn sinh học dàn lạnh diệt nấm mốc nấm mầm',
            unit: 'Máy',
            price: 50000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 2: Bơm gas máy lạnh treo tường (Thợ Cường) ---
  const sACGas = await prisma.service.create({
    data: {
      providerId: provider1.id,
      categoryId: catTech.id,
      name: 'Bơm Gas máy lạnh bổ sung chuẩn R32 / R410A',
      description:
        'Khắc phục ngay tình trạng máy lạnh chạy thổi gió nóng, đóng tuyết đường ống đồng. Kiểm tra rò rỉ khớp nối rắc co, đo áp suất gas đầu hút đầu đẩy bằng đồng hồ đo chuẩn kỹ thuật và bơm bổ sung đạt định mức nhà sản xuất.',
      referencePrice: 100000,
      status: 'ACTIVE',
      avgRating: 4.6,
      totalReviews: 12,
      images: {
        create: {
          imageUrl: '/images/ac_gas.png',
          cloudinaryId: 'seed_ac_gas',
        },
      },
      items: {
        create: [
          {
            name: 'Bơm nạp bổ sung Gas R32 / R410A bằng đồng hồ đo áp',
            unit: 'PSI',
            price: 2000,
          },
          {
            name: 'Nạp gas toàn phần trọn gói máy lạnh 1.0HP - 1.5HP',
            unit: 'Máy',
            price: 350000,
          },
          {
            name: 'Nạp gas toàn phần trọn gói máy lạnh 2.0HP - 2.5HP',
            unit: 'Máy',
            price: 450000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 3: Sửa chữa chập nhảy điện Aptomat (Thợ Hải) ---
  const sElec = await prisma.service.create({
    data: {
      providerId: provider2.id,
      categoryId: catTech.id,
      name: 'Dò tìm rò rỉ điện nhảy aptomat chập nguồn âm tường',
      description:
        'Thợ điện nước chuyên nghiệp xử lý triệt để tình trạng nhảy CB không rõ nguyên nhân, chập nổ ổ cắm, mất điện từng vùng tại gia đình. Đo kiểm tra thông mạch, rò rỉ pha điện âm tường bằng megomet chuyên dụng.',
      referencePrice: 250000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 32,
      images: {
        create: {
          imageUrl: '/images/elec_leak.png',
          cloudinaryId: 'seed_elec_leak',
        },
      },
      items: {
        create: [
          {
            name: 'Dò tìm vị trí chập điện cháy nổ hệ thống chôn âm',
            unit: 'Lần',
            price: 250000,
          },
          {
            name: 'Thay thế Aptomat tổng hoặc CB nhánh chập cháy',
            unit: 'Cái',
            price: 120000,
          },
          {
            name: 'Thay thế ổ cắm chập điện Panasonic chính hãng',
            unit: 'Cái',
            price: 70000,
          },
          {
            name: 'Lắp đặt đèn LED âm trần / đèn rọi ray bếp',
            unit: 'Bộ',
            price: 90000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 4: Thông tắc bồn cầu nghẹt (Thợ Hải) ---
  const sPlumb = await prisma.service.create({
    data: {
      providerId: provider2.id,
      categoryId: catTech.id,
      name: 'Thông bồn cầu chậu rửa bát cống thoát nghẹt',
      description:
        'Thông tắc bồn cầu nghẹt giấy, nghẹt vật cứng, chậu rửa bát mỡ đóng bánh. Sử dụng công cụ máy nén khí áp lực cao hoặc máy lò xo chuyên nghiệp công nghệ mới không đục phá nền gạch, không mùi hôi.',
      referencePrice: 300000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 18,
      images: {
        create: {
          imageUrl: '/images/plumbing_clog.png',
          cloudinaryId: 'seed_plumb_clog',
        },
      },
      items: {
        create: [
          {
            name: 'Thông bồn cầu nghẹt bằng súng nén áp suất khí',
            unit: 'Lượt',
            price: 350000,
          },
          {
            name: 'Thông đường ống thoát chậu rửa bát bằng máy lò xo',
            unit: 'Mét',
            price: 150000,
          },
          {
            name: 'Thay thế phao cơ xả nước bồn cầu hai nút nhấn',
            unit: 'Bộ',
            price: 220000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 5: Vệ sinh dọn dẹp nhà cửa theo giờ (Công ty CleanHouse) ---
  const sClean = await prisma.service.create({
    data: {
      providerId: provider5.id,
      categoryId: catClean.id,
      name: 'Dọn dẹp nhà cửa lau chùi sắp xếp theo giờ',
      description:
        'Dịch vụ dọn nhà định kỳ, quét dọn, lau sàn, rửa chén bát, thay ga đệm chăn màn, lau kính căn hộ chung cư hoặc nhà phố. Nhân viên có hồ sơ tư pháp sạch sẽ, được đào tạo quy trình vệ sinh 5 sao, mang theo đầy đủ dụng cụ tẩy rửa.',
      referencePrice: 70000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 45,
      images: {
        create: {
          imageUrl: '/images/house_cleaning.png',
          cloudinaryId: 'seed_house_clean',
        },
      },
      items: {
        create: [
          {
            name: 'Ca dọn dẹp nhà cửa cơ bản theo giờ (Tối thiểu 3 tiếng)',
            unit: 'Giờ',
            price: 75000,
          },
          {
            name: 'Gói tổng vệ sinh nhà mới xây xong chùi bụi sơn vôi',
            unit: 'Mét vuông',
            price: 18000,
          },
          {
            name: 'Gói lau kính ban công và cửa kính lớn chung cư',
            unit: 'Tấm',
            price: 50000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 6: Giặt Sofa nệm rèm hơi nước nóng (Công ty CleanHouse) ---
  const sSofa = await prisma.service.create({
    data: {
      providerId: provider5.id,
      categoryId: catClean.id,
      name: 'Giặt ghế Sofa Đệm bông ép Rèm cửa sấy khô tại chỗ',
      description:
        'Giặt hấp loại bỏ 99% vi khuẩn, ẩm mốc, mùi mồ hôi bằng công nghệ hơi nước nóng phun hút sâu của Karcher (Đức). Sử dụng dung dịch tẩy rửa hữu cơ an toàn cho sức khỏe trẻ nhỏ và thú cưng.',
      referencePrice: 300000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 29,
      images: {
        create: {
          imageUrl: '/images/sofa_cleaning.png',
          cloudinaryId: 'seed_sofa_clean',
        },
      },
      items: {
        create: [
          {
            name: 'Giặt hơi nước nóng ghế Sofa vải nỉ góc chữ L dưới 2.5m',
            unit: 'Bộ',
            price: 350000,
          },
          {
            name: 'Giặt dưỡng sâu ghế Sofa da cao cấp phủ kem làm bóng',
            unit: 'Bộ',
            price: 450000,
          },
          {
            name: 'Giặt hơi nước khử trùng đệm cao su size King 1m8x2m',
            unit: 'Tấm',
            price: 300000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 7: Sửa board bếp từ đôi bếp ngoại (Thợ Sơn) ---
  const sAppliances = await prisma.service.create({
    data: {
      providerId: provider3.id,
      categoryId: catTech.id,
      name: 'Sửa chữa bếp từ bếp hồng ngoại lỗi cắm nhảy aptomat',
      description:
        'Khắc phục triệt để các lỗi bếp từ báo E0, E1, E2... không nóng, hỏng bàn phím cảm ứng, chập cháy nổ cầu chì IGBT. Linh kiện thay thế chính hãng có dán tem bảo hành từ 6 đến 12 tháng.',
      referencePrice: 200000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 14,
      images: {
        create: {
          imageUrl: '/images/cooker_repair.png',
          cloudinaryId: 'seed_cooker_fix',
        },
      },
      items: {
        create: [
          {
            name: 'Sửa board mạch lỗi nguồn bếp từ đơn tại chỗ',
            unit: 'Lượt',
            price: 250000,
          },
          {
            name: 'Sửa lỗi không nhận nồi bếp từ đôi cao cấp của Đức/Ý',
            unit: 'Lượt',
            price: 450000,
          },
          {
            name: 'Thay thế mặt kính bếp từ chịu nhiệt bị nứt vỡ',
            unit: 'Cái',
            price: 1200000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 8: Cài Win và vệ sinh Laptop tận nơi (Thợ Sơn) ---
  const sIT = await prisma.service.create({
    data: {
      providerId: provider3.id,
      categoryId: catIT.id,
      name: 'Vệ sinh Laptop bôi keo MX4 & Cài Win tận nhà',
      description:
        'Khắc phục máy tính chậm đơ, tự tắt nguồn do quá nóng. Kỹ thuật viên qua trực tiếp cài hệ điều hành Windows 10/11 sạch sẽ, bôi keo tản nhiệt ARCTIC MX-4 mát lạnh cho CPU/GPU và quét bụi quạt gió.',
      referencePrice: 150000,
      status: 'ACTIVE',
      avgRating: 4.8,
      totalReviews: 21,
      images: {
        create: {
          imageUrl: '/images/laptop_repair.png',
          cloudinaryId: 'seed_pc_clean',
        },
      },
      items: {
        create: [
          {
            name: 'Vệ sinh tháo máy bôi keo tản nhiệt Laptop chuyên nghiệp',
            unit: 'Máy',
            price: 150000,
          },
          {
            name: 'Cài lại Windows 10/11 & Drivers & Office cơ bản',
            unit: 'Máy',
            price: 200000,
          },
          {
            name: 'Nâng cấp ổ cứng SSD siêu tốc 256GB chính hãng',
            unit: 'Chiếc',
            price: 550000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 9: Massage trị liệu vai gáy (Thợ Giang) ---
  const sMassage = await prisma.service.create({
    data: {
      providerId: provider4.id,
      categoryId: catWellness.id,
      name: 'Massage bấm huyệt trị liệu đau mỏi vai gáy cột sống',
      description:
        'Xua tan tức thì cơn đau mỏi, tê bì tay chân do ngồi văn phòng sai tư thế. Liệu trình bấm huyệt khai thông kinh lạc cổ vai gáy sử dụng tinh dầu thảo dược thiên nhiên, kết hợp giác hơi đá nóng giãn cơ.',
      referencePrice: 250000,
      status: 'ACTIVE',
      avgRating: 4.9,
      totalReviews: 38,
      images: {
        create: {
          imageUrl: '/images/massage_therapy.png',
          cloudinaryId: 'seed_massage',
        },
      },
      items: {
        create: [
          {
            name: 'Xoa bóp bấm huyệt thông kinh lạc vai gáy 60 phút',
            unit: 'Ca',
            price: 250000,
          },
          {
            name: 'Liệu trình massage body thải độc kết hợp đá nóng 90 phút',
            unit: 'Ca',
            price: 380000,
          },
          {
            name: 'Giác hơi cạo gió bằng bộ giác chân không an toàn',
            unit: 'Lượt',
            price: 80000,
          },
        ],
      },
    },
  });

  // --- Dịch vụ 10: Cắt tóc nam nữ tại nhà (Thợ Giang) ---
  const sHair = await prisma.service.create({
    data: {
      providerId: provider4.id,
      categoryId: catWellness.id,
      name: 'Cắt tóc tạo kiểu nam nữ chuẩn Salon tại nhà',
      description:
        'Dịch vụ tạo mẫu tóc tận nơi dành cho gia đình bận rộn, người lớn tuổi hoặc trẻ em sợ tiệm tóc. Stylist chuyên nghiệp mang theo đầy đủ kéo, gương di động, khăn choàng, đảm bảo gọn gàng sạch sẽ không để lại vụn tóc.',
      referencePrice: 80000,
      status: 'ACTIVE',
      avgRating: 4.7,
      totalReviews: 16,
      images: {
        create: {
          imageUrl: '/images/haircut_home.png',
          cloudinaryId: 'seed_hair_cut',
        },
      },
      items: {
        create: [
          {
            name: 'Cắt tóc nam tạo kiểu Mohican / Layer sấy Wax vuốt nếp',
            unit: 'Đầu',
            price: 80000,
          },
          {
            name: 'Cắt tạo kiểu tóc nữ Layer / Bob Hàn Quốc thời thượng',
            unit: 'Đầu',
            price: 150000,
          },
          {
            name: 'Ráy tai ráy ướt ráy khô thư giãn nghệ thuật',
            unit: 'Bộ',
            price: 60000,
          },
        ],
      },
    },
  });

  const sPestPending = await prisma.service.create({
    data: {
      providerId: provider5.id,
      categoryId: catClean.id,
      name: 'Phun khử khuẩn diệt côn trùng căn hộ',
      description:
        'Dịch vụ phun khử khuẩn, diệt kiến gián muỗi bằng dung dịch an toàn cho gia đình. Hồ sơ này để demo luồng admin duyệt dịch vụ.',
      referencePrice: 420000,
      status: 'PENDING',
      images: {
        create: {
          imageUrl: '/images/pest_control.png',
          cloudinaryId: 'seed_pest_pending',
        },
      },
      items: {
        create: [
          {
            name: 'Phun diệt côn trùng căn hộ dưới 80m2',
            unit: 'Căn',
            price: 420000,
          },
          {
            name: 'Khử khuẩn bề mặt sau cải tạo hoặc chuyển nhà',
            unit: 'Lượt',
            price: 300000,
          },
        ],
      },
    },
  });

  const sMakeupHidden = await prisma.service.create({
    data: {
      providerId: provider4.id,
      categoryId: catWellness.id,
      name: 'Trang điểm dự tiệc tại nhà',
      description:
        'Gói trang điểm dự tiệc, chụp ảnh, đi sự kiện tại nhà. Dịch vụ đang ẩn để demo trạng thái quản lý dịch vụ của provider/admin.',
      referencePrice: 500000,
      status: 'HIDDEN',
      avgRating: 4.5,
      totalReviews: 6,
      images: {
        create: {
          imageUrl: '/images/makeup_home.png',
          cloudinaryId: 'seed_makeup_hidden',
        },
      },
      items: {
        create: [
          {
            name: 'Trang điểm dự tiệc phong cách tự nhiên',
            unit: 'Người',
            price: 500000,
          },
          {
            name: 'Làm tóc đi kèm trang điểm',
            unit: 'Người',
            price: 200000,
          },
        ],
      },
    },
  });

  await prisma.featuredListing.createMany({
    data: [
      {
        serviceId: sACClean.id,
        providerId: provider1.id,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        dailyRate: 30000,
        totalCost: 210000,
        status: 'ACTIVE',
      },
      {
        serviceId: sClean.id,
        providerId: provider5.id,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dailyRate: 30000,
        totalCost: 270000,
        status: 'EXPIRED',
      },
      {
        serviceId: sMakeupHidden.id,
        providerId: provider4.id,
        startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        dailyRate: 30000,
        totalCost: 210000,
        status: 'CANCELLED',
      },
    ],
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
      completedAt: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
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
      quotations: {
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
  const b2 = await prisma.booking.create({
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
      quotations: {
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

  const b3 = await prisma.booking.create({
    data: {
      bookingCode: 'BK_PENDING1',
      customerId: customer2.id,
      providerId: provider1.id,
      serviceId: sACGas.id,
      description: 'Máy lạnh phòng ngủ không lạnh, nghi thiếu gas',
      province: 'Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường Võ Thị Sáu',
      addressDetail: '45 Nguyễn Đình Chiểu',
      desiredTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      providerResponseDeadline: new Date(Date.now() + 30 * 60 * 1000),
      bookingItems: {
        create: [
          {
            name: 'Nạp gas toàn phần trọn gói máy lạnh 1.0HP - 1.5HP',
            unit: 'Máy',
            quantity: 1,
            priceSnapshot: 350000,
          },
        ],
      },
    },
  });

  const b4 = await prisma.booking.create({
    data: {
      bookingCode: 'BK_QUOTED1',
      customerId: customer.id,
      providerId: provider4.id,
      serviceId: sMassage.id,
      description:
        'Đau vai gáy do ngồi làm việc lâu, muốn đặt liệu trình 90 phút',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressDetail: '123 Lê Lợi, Căn hộ A102',
      desiredTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'QUOTED',
      providerAcceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      bookingItems: {
        create: [
          {
            name: 'Liệu trình massage body thải độc kết hợp đá nóng 90 phút',
            unit: 'Ca',
            quantity: 1,
            priceSnapshot: 380000,
          },
        ],
      },
      quotations: {
        create: {
          actualPrice: 380000,
          commissionRateSnapshot: 10,
          estimatedTime: '90 phút',
          note: 'Có thể đến sau 18h, chuẩn bị không gian yên tĩnh trước khi trị liệu.',
          quotationItems: {
            create: [
              {
                name: 'Liệu trình massage body thải độc kết hợp đá nóng 90 phút',
                unit: 'Ca',
                quantity: 1,
                price: 380000,
              },
            ],
          },
        },
      },
    },
  });

  const b5 = await prisma.booking.create({
    data: {
      bookingCode: 'BK_DISPUTE1',
      customerId: customer2.id,
      providerId: provider5.id,
      serviceId: sSofa.id,
      description: 'Giặt sofa chữ L nhưng sau khi khô vẫn còn vết ố ở tay ghế',
      province: 'Hồ Chí Minh',
      district: 'Quận Bình Thạnh',
      ward: 'Phường 25',
      addressDetail: 'Tòa nhà Pearl Plaza, 561A Điện Biên Phủ',
      desiredTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'DISPUTED',
      providerAcceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      autoCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      bookingItems: {
        create: [
          {
            name: 'Giặt hơi nước nóng ghế Sofa vải nỉ góc chữ L dưới 2.5m',
            unit: 'Bộ',
            quantity: 1,
            priceSnapshot: 350000,
          },
        ],
      },
      quotations: {
        create: {
          actualPrice: 350000,
          commissionRateSnapshot: 10,
          estimatedTime: '2 giờ',
          note: 'Khách phản ánh còn vết ố sau khi khô, cần admin xử lý khiếu nại.',
          quotationItems: {
            create: [
              {
                name: 'Giặt hơi nước nóng ghế Sofa vải nỉ góc chữ L dưới 2.5m',
                unit: 'Bộ',
                quantity: 1,
                price: 350000,
              },
            ],
          },
        },
      },
    },
  });

  const b6 = await prisma.booking.create({
    data: {
      bookingCode: 'BK_CANCEL1',
      customerId: customer.id,
      providerId: provider3.id,
      serviceId: sIT.id,
      description: 'Cài Windows cho laptop văn phòng nhưng khách đổi lịch',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressDetail: '123 Lê Lợi',
      desiredTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'CANCELLED',
      bookingItems: {
        create: [
          {
            name: 'Cài lại Windows 10/11 & Drivers & Office cơ bản',
            unit: 'Máy',
            quantity: 1,
            priceSnapshot: 200000,
          },
        ],
      },
    },
  });

  await prisma.bookingStatusHistory.createMany({
    data: [
      {
        bookingId: b1.id,
        fromStatus: 'PENDING',
        toStatus: 'QUOTED',
        changedBy: provider1.id,
        note: 'Provider đã khảo sát và gửi báo giá',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        bookingId: b1.id,
        fromStatus: 'QUOTED',
        toStatus: 'CONFIRMED',
        changedBy: customer.id,
        note: 'Khách đồng ý báo giá',
        createdAt: new Date(
          Date.now() - 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000,
        ),
      },
      {
        bookingId: b1.id,
        fromStatus: 'CONFIRMED',
        toStatus: 'IN_PROGRESS',
        changedBy: provider1.id,
        note: 'Provider bắt đầu xử lý tại nhà khách',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        bookingId: b1.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'DONE',
        changedBy: customer.id,
        note: 'Khách nghiệm thu hoàn tất',
        createdAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        ),
      },
      {
        bookingId: b2.id,
        fromStatus: 'PENDING',
        toStatus: 'QUOTED',
        changedBy: provider2.id,
        note: 'Provider báo giá phát sinh thay ổ cắm',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        bookingId: b2.id,
        fromStatus: 'QUOTED',
        toStatus: 'CONFIRMED',
        changedBy: customer.id,
        note: 'Khách xác nhận báo giá',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        bookingId: b2.id,
        fromStatus: 'CONFIRMED',
        toStatus: 'IN_PROGRESS',
        changedBy: provider2.id,
        note: 'Provider đang xử lý tại hiện trường',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        bookingId: b3.id,
        fromStatus: 'PENDING',
        toStatus: 'PENDING',
        changedBy: customer2.id,
        note: 'Khách tạo yêu cầu, đang chờ provider phản hồi',
      },
      {
        bookingId: b4.id,
        fromStatus: 'PENDING',
        toStatus: 'QUOTED',
        changedBy: provider4.id,
        note: 'Provider gửi báo giá trị liệu 90 phút',
      },
      {
        bookingId: b5.id,
        fromStatus: 'DONE',
        toStatus: 'DISPUTED',
        changedBy: customer2.id,
        note: 'Khách tạo khiếu nại còn vết ố trên sofa',
      },
      {
        bookingId: b6.id,
        fromStatus: 'PENDING',
        toStatus: 'CANCELLED',
        changedBy: customer.id,
        note: 'Khách đổi lịch nên hủy yêu cầu',
      },
    ],
  });

  await prisma.bookingAttachment.createMany({
    data: [
      {
        bookingId: b1.id,
        type: 'RESULT',
        fileUrl: '/images/demo-result-ac-1.png',
      },
      {
        bookingId: b2.id,
        type: 'SURVEY',
        fileUrl: '/images/demo-survey-electric-1.png',
      },
      {
        bookingId: b5.id,
        type: 'RESULT',
        fileUrl: '/images/demo-result-sofa-1.png',
      },
    ],
  });

  await prisma.review.create({
    data: {
      bookingId: b1.id,
      customerId: customer.id,
      serviceId: sACClean.id,
      rating: 5,
      comment:
        'Thợ đến đúng giờ, vệ sinh sạch, máy lạnh mát hơn rõ. Rất phù hợp để demo đánh giá dịch vụ.',
    },
  });

  const dispute = await prisma.dispute.create({
    data: {
      bookingId: b5.id,
      raisedBy: customer2.id,
      assignedTo: staff.id,
      reason: 'Sofa vẫn còn vết ố sau khi giặt, khách yêu cầu kiểm tra lại.',
      status: 'IN_REVIEW',
      aiSummary:
        'Khách cung cấp ảnh vết ố sau khi dịch vụ hoàn tất. Cần provider phản hồi và admin xem xét hoàn tiền một phần hoặc yêu cầu xử lý lại.',
      evidences: {
        create: [
          {
            type: 'IMAGE',
            fileUrl: '/images/demo-dispute-sofa-stain.png',
            uploadedBy: customer2.id,
          },
        ],
      },
    },
  });

  const provider1Wallet = await prisma.providerWallet.findUnique({
    where: { providerId: provider1.id },
  });
  const provider2Wallet = await prisma.providerWallet.findUnique({
    where: { providerId: provider2.id },
  });
  const provider5Wallet = await prisma.providerWallet.findUnique({
    where: { providerId: provider5.id },
  });
  if (!provider1Wallet || !provider2Wallet || !provider5Wallet) {
    throw new Error('Provider wallet seed failed');
  }

  await prisma.walletTransaction.createMany({
    data: [
      {
        walletId: provider1Wallet.id,
        type: 'COMMISSION',
        amount: -30000,
        bookingId: b1.id,
        status: 'SUCCESS',
        idempotencyKey: `commission:${b1.id}`,
        processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        walletId: provider1Wallet.id,
        type: 'FEATURED_FEE',
        amount: -210000,
        status: 'SUCCESS',
        idempotencyKey: `featured:${sACClean.id}:seed`,
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        walletId: provider2Wallet.id,
        type: 'DEPOSIT',
        amount: 500000,
        status: 'SUCCESS',
        vnpayTxnRef: 'SEED_VNPAY_001',
        idempotencyKey: 'vnpay:SEED_VNPAY_001',
        processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        walletId: provider5Wallet.id,
        type: 'PENALTY',
        amount: -50000,
        bookingId: b5.id,
        disputeId: dispute.id,
        status: 'PENDING',
        idempotencyKey: `dispute:${dispute.id}:pending-penalty`,
      },
    ],
  });

  await prisma.manualDepositRequest.createMany({
    data: [
      {
        providerId: provider1.id,
        amount: 300000,
        transferCode: 'NAPVI-DEMO-001',
        receiptUrl: '/images/demo-transfer-receipt.png',
        status: 'PENDING',
      },
      {
        providerId: provider2.id,
        amount: 500000,
        transferCode: 'NAPVI-DEMO-APPROVED',
        receiptUrl: '/images/demo-transfer-approved.png',
        status: 'APPROVED',
        processedBy: admin.id,
        processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        adminNote: 'Đã đối soát chuyển khoản demo.',
      },
    ],
  });

  await prisma.withdrawalRequest.createMany({
    data: [
      {
        providerId: provider1.id,
        amount: 200000,
        bankName: 'Vietcombank',
        bankAccountNumber: '0123456789',
        bankAccountHolder: 'NGUYEN DUC CUONG',
        status: 'PENDING',
      },
      {
        providerId: provider5.id,
        amount: 300000,
        bankName: 'Techcombank',
        bankAccountNumber: '9988776655',
        bankAccountHolder: 'CLEANHOUSE COMPANY',
        status: 'REJECTED',
        processedBy: admin.id,
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        adminNote: 'Thông tin tài khoản không khớp hồ sơ KYC.',
      },
    ],
  });

  const conversation1 = await prisma.conversation.create({
    data: {
      bookingId: b1.id,
      serviceId: sACClean.id,
      customerId: customer.id,
      providerId: provider1.id,
      messages: {
        create: [
          {
            senderId: customer.id,
            senderType: 'CUSTOMER',
            content:
              'Anh đến vệ sinh giúp em 2 máy lạnh vào chiều nay được không?',
            isRead: true,
          },
          {
            senderId: provider1.id,
            senderType: 'PROVIDER',
            content: 'Được anh/chị, em sẽ đến trong khung giờ 14h-15h.',
            isRead: true,
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      bookingId: b5.id,
      serviceId: sSofa.id,
      customerId: customer2.id,
      providerId: provider5.id,
      messages: {
        create: [
          {
            senderId: customer2.id,
            senderType: 'CUSTOMER',
            content:
              'Sofa khô rồi nhưng tay ghế vẫn còn vết ố, bên mình kiểm tra lại giúp.',
            isRead: false,
          },
          {
            senderId: provider5.id,
            senderType: 'PROVIDER',
            content:
              'Bên em đã nhận thông tin và sẽ phối hợp với admin để xử lý.',
            isRead: false,
          },
        ],
      },
    },
  });

  await prisma.chatbotSession.create({
    data: {
      userId: customer.id,
      title: 'Tư vấn vệ sinh máy lạnh',
      summary:
        'Khách hỏi dịch vụ vệ sinh máy lạnh và được gợi ý đặt provider Cường.',
      state: {
        intent: 'service_search',
        district: 'Quận 1',
        serviceKeyword: 'máy lạnh',
        selectedServiceId: sACClean.id,
      },
      messages: {
        create: [
          {
            role: 'user',
            content:
              'Máy lạnh nhà tôi lâu ngày chưa vệ sinh, có dịch vụ nào không?',
          },
          {
            role: 'assistant',
            content:
              'Bạn có thể đặt dịch vụ vệ sinh máy lạnh treo tường chuyên sâu, giá tham khảo từ 150.000đ/bộ.',
            metadata: { serviceId: sACClean.id },
          },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        type: 'BOOKING',
        title: 'Lịch hẹn đã hoàn tất',
        content: 'Booking BK764129 đã được nghiệm thu thành công.',
        referenceId: b1.id,
        isRead: false,
      },
      {
        userId: customer.id,
        type: 'CHATBOT',
        title: 'Gợi ý dịch vụ phù hợp',
        content: 'Chatbot đã lưu gợi ý vệ sinh máy lạnh cho lần đặt tiếp theo.',
        referenceId: sACClean.id,
        isRead: true,
      },
      {
        userId: provider1.id,
        type: 'WALLET',
        title: 'Có yêu cầu rút tiền đang chờ xử lý',
        content: 'Yêu cầu rút 200.000đ đang chờ admin duyệt.',
        isRead: false,
      },
      {
        userId: provider5.id,
        type: 'DISPUTE',
        title: 'Có khiếu nại cần phản hồi',
        content: 'Booking BK_DISPUTE1 đang được admin xem xét.',
        referenceId: dispute.id,
        isRead: false,
      },
      {
        userId: admin.id,
        type: 'AUDIT',
        title: 'Seed demo đã tạo dữ liệu mới',
        content: 'Hệ thống có dữ liệu booking, ví, audit và khiếu nại để demo.',
        isRead: true,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'STAFF_CREATED',
        targetType: 'User',
        targetId: staff.id,
        description:
          'Tạo nhân viên điều phối demo với quyền booking/dispute/wallet/audit.',
        ipAddress: '127.0.0.1',
      },
      {
        actorId: staff.id,
        action: 'SERVICE_REVIEWED',
        targetType: 'Service',
        targetId: sPestPending.id,
        description: 'Nhân viên mở hồ sơ dịch vụ đang chờ duyệt để kiểm tra.',
        ipAddress: '127.0.0.1',
      },
      {
        actorId: customer2.id,
        action: 'DISPUTE_CREATED',
        targetType: 'Dispute',
        targetId: dispute.id,
        description: 'Khách tạo khiếu nại còn vết ố sau khi giặt sofa.',
        ipAddress: '127.0.0.1',
      },
      {
        actorId: admin.id,
        action: 'FEATURED_RATE_UPDATED',
        targetType: 'SystemSetting',
        targetId: 0,
        description: 'Cấu hình phí nổi bật 30.000đ/ngày cho dữ liệu demo.',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log(`Conversation mẫu đã tạo: ${conversation1.id}`);

  console.log('=== SEED DỮ LIỆU ĐA DỊCH VỤ THÀNH CÔNG ===');
  console.log('Tài khoản Test:');
  console.log('* Admin: admin@system.com / password123');
  console.log('* Staff: staff@demo.com / password123');
  console.log('* Khách hàng: customer@demo.com / password123');
  console.log('* Khách hàng 2: customer2@demo.com / password123');
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
