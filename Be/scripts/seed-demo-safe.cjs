const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'password123';

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

async function upsertUser({
  email,
  fullName,
  phone,
  role,
  permissions = [],
}) {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      role,
      permissions,
      status: 'ACTIVE',
      emailVerified: true,
      password,
    },
    create: {
      email,
      password,
      fullName,
      phone,
      role,
      permissions,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
}

async function upsertCategory(name, level, parentId = null) {
  return prisma.serviceCategory.upsert({
    where: { name },
    update: { level, parentId, isDeleted: false },
    create: { name, level, parentId },
  });
}

async function ensureAddress(userId, data) {
  const existing = await prisma.userAddress.findFirst({
    where: { userId, label: data.label },
    select: { id: true },
  });
  if (existing) {
    return prisma.userAddress.update({ where: { id: existing.id }, data });
  }
  return prisma.userAddress.create({ data: { userId, ...data } });
}

async function ensureProviderProfile(providerId, balance = 1500000) {
  await prisma.providerWallet.upsert({
    where: { providerId },
    update: { balance, isRestricted: false },
    create: { providerId, balance, isRestricted: false },
  });

  const existingKyc = await prisma.kycProfile.findFirst({
    where: { providerId },
    select: { id: true },
  });

  const data = {
    cccdFrontUrl:
      'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
    cccdBackUrl:
      'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
    portraitUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    status: 'APPROVED',
  };

  if (existingKyc) {
    await prisma.kycProfile.update({ where: { id: existingKyc.id }, data });
  } else {
    await prisma.kycProfile.create({ data: { providerId, ...data } });
  }
}

async function ensureService({
  providerId,
  categoryId,
  name,
  description,
  imageUrl,
  status = 'ACTIVE',
  referencePrice = 150000,
  avgRating = 4.8,
  totalReviews = 24,
  items,
}) {
  const data = {
    providerId,
    categoryId,
    name,
    description,
    referencePrice,
    status,
    avgRating,
    totalReviews,
    isDeleted: false,
  };

  const existing = await prisma.service.findFirst({
    where: { providerId, name },
    select: { id: true },
  });

  const service = existing
    ? await prisma.service.update({ where: { id: existing.id }, data })
    : await prisma.service.create({ data });

  await prisma.serviceImage.deleteMany({ where: { serviceId: service.id } });
  await prisma.serviceItem.deleteMany({ where: { serviceId: service.id } });

  await prisma.serviceImage.create({
    data: {
      serviceId: service.id,
      imageUrl,
      cloudinaryId: `demo_${service.id}`,
      displayOrder: 0,
    },
  });

  await prisma.serviceItem.createMany({
    data: items.map((item) => ({ serviceId: service.id, ...item })),
  });

  return service;
}

async function ensureSystemSetting(key, value) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function ensureBooking({
  bookingCode,
  customerId,
  providerId,
  serviceId,
  description,
  address,
  desiredTime,
  status,
  providerAcceptedAt,
  providerResponseDeadline,
  completedAt,
  autoCompletedAt,
  items,
  quotation,
  histories,
}) {
  const data = {
    bookingCode,
    customerId,
    providerId,
    serviceId,
    description,
    ...address,
    desiredTime,
    status,
    providerAcceptedAt,
    providerResponseDeadline,
    completedAt,
    autoCompletedAt,
  };

  const booking = await prisma.booking.upsert({
    where: { bookingCode },
    update: data,
    create: data,
  });

  await prisma.bookingStatusHistory.deleteMany({
    where: { bookingId: booking.id },
  });
  await prisma.bookingItem.deleteMany({ where: { bookingId: booking.id } });
  const existingQuotation = await prisma.quotation.findUnique({
    where: { bookingId: booking.id },
    select: { id: true },
  });
  if (existingQuotation) {
    await prisma.quotationItem.deleteMany({
      where: { quotationId: existingQuotation.id },
    });
    await prisma.quotation.delete({ where: { id: existingQuotation.id } });
  }

  await prisma.bookingItem.createMany({
    data: items.map((item) => ({ bookingId: booking.id, ...item })),
  });

  if (quotation) {
    await prisma.quotation.create({
      data: {
        bookingId: booking.id,
        actualPrice: quotation.actualPrice,
        commissionRateSnapshot: quotation.commissionRateSnapshot,
        estimatedTime: quotation.estimatedTime,
        note: quotation.note,
        quotationItems: {
          create: quotation.items,
        },
      },
    });
  }

  await prisma.bookingStatusHistory.createMany({
    data: histories.map((history) => ({
      bookingId: booking.id,
      ...history,
    })),
  });

  return booking;
}

async function ensureFeaturedListing({
  serviceId,
  providerId,
  status,
  startDate,
  endDate,
  dailyRate,
  totalCost,
}) {
  const existing = await prisma.featuredListing.findFirst({
    where: { serviceId, providerId, status },
    select: { id: true },
  });
  const data = { serviceId, providerId, status, startDate, endDate, dailyRate, totalCost };
  if (existing) {
    return prisma.featuredListing.update({ where: { id: existing.id }, data });
  }
  return prisma.featuredListing.create({ data });
}

async function ensureWalletTransaction(data) {
  const existing = await prisma.walletTransaction.findFirst({
    where: data.idempotencyKey
      ? { idempotencyKey: data.idempotencyKey }
      : { vnpayTxnRef: data.vnpayTxnRef },
    select: { id: true },
  });
  if (existing) {
    return prisma.walletTransaction.update({ where: { id: existing.id }, data });
  }
  return prisma.walletTransaction.create({ data });
}

async function ensureManualDeposit(data) {
  const existing = await prisma.manualDepositRequest.findFirst({
    where: { providerId: data.providerId, transferCode: data.transferCode },
    select: { id: true },
  });
  if (existing) {
    return prisma.manualDepositRequest.update({ where: { id: existing.id }, data });
  }
  return prisma.manualDepositRequest.create({ data });
}

async function ensureWithdrawal(data) {
  const existing = await prisma.withdrawalRequest.findFirst({
    where: {
      providerId: data.providerId,
      amount: data.amount,
      bankAccountNumber: data.bankAccountNumber,
    },
    select: { id: true },
  });
  if (existing) {
    return prisma.withdrawalRequest.update({ where: { id: existing.id }, data });
  }
  return prisma.withdrawalRequest.create({ data });
}

async function ensureDispute({ bookingId, raisedBy, assignedTo, reason }) {
  const dispute = await prisma.dispute.upsert({
    where: { bookingId },
    update: {
      raisedBy,
      assignedTo,
      reason,
      status: 'IN_REVIEW',
      aiSummary:
        'Khách cung cấp ảnh vết ố sau khi dịch vụ hoàn tất. Cần provider phản hồi và admin xem xét.',
    },
    create: {
      bookingId,
      raisedBy,
      assignedTo,
      reason,
      status: 'IN_REVIEW',
      aiSummary:
        'Khách cung cấp ảnh vết ố sau khi dịch vụ hoàn tất. Cần provider phản hồi và admin xem xét.',
    },
  });

  await prisma.disputeEvidence.deleteMany({ where: { disputeId: dispute.id } });
  await prisma.disputeEvidence.create({
    data: {
      disputeId: dispute.id,
      type: 'IMAGE',
      fileUrl: '/images/demo-dispute-sofa-stain.png',
      uploadedBy: raisedBy,
    },
  });

  return dispute;
}

async function ensureConversation({
  bookingId,
  serviceId,
  customerId,
  providerId,
  messages,
}) {
  const existing = await prisma.conversation.findFirst({
    where: { customerId, providerId, serviceId },
    select: { id: true },
  });
  const data = { bookingId, serviceId, customerId, providerId };
  const conversation = existing
    ? await prisma.conversation.update({ where: { id: existing.id }, data })
    : await prisma.conversation.create({ data });

  await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
  await prisma.message.createMany({
    data: messages.map((message) => ({
      conversationId: conversation.id,
      ...message,
    })),
  });
}

async function ensureChatbotSession(userId, serviceId) {
  const title = 'Tư vấn vệ sinh máy lạnh';
  const existing = await prisma.chatbotSession.findFirst({
    where: { userId, title },
    select: { id: true },
  });

  const data = {
    userId,
    title,
    summary: 'Khách hỏi dịch vụ vệ sinh máy lạnh và được gợi ý đặt provider Cường.',
    state: {
      intent: 'service_search',
      district: 'Quận 1',
      serviceKeyword: 'máy lạnh',
      selectedServiceId: serviceId,
    },
  };

  const session = existing
    ? await prisma.chatbotSession.update({ where: { id: existing.id }, data })
    : await prisma.chatbotSession.create({ data });

  await prisma.chatbotSessionMessage.deleteMany({
    where: { sessionId: session.id },
  });
  await prisma.chatbotSessionMessage.createMany({
    data: [
      {
        sessionId: session.id,
        role: 'user',
        content: 'Máy lạnh nhà tôi lâu ngày chưa vệ sinh, có dịch vụ nào không?',
      },
      {
        sessionId: session.id,
        role: 'assistant',
        content:
          'Bạn có thể đặt dịch vụ vệ sinh máy lạnh treo tường chuyên sâu, giá tham khảo từ 150.000đ/bộ.',
        metadata: { serviceId },
      },
    ],
  });
}

async function ensureNotification(data) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      referenceId: data.referenceId,
    },
    select: { id: true },
  });
  if (existing) {
    return prisma.notification.update({ where: { id: existing.id }, data });
  }
  return prisma.notification.create({ data });
}

async function ensureAuditLog(data) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      actorId: data.actorId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
    },
    select: { id: true },
  });
  if (existing) {
    return prisma.auditLog.update({ where: { id: existing.id }, data });
  }
  return prisma.auditLog.create({ data });
}

async function main() {
  const admin = await upsertUser({
    email: 'admin@system.com',
    fullName: 'Quản Trị Viên Hệ Thống',
    phone: '0900000000',
    role: 'ADMIN',
  });

  const staff = await upsertUser({
    email: 'staff@demo.com',
    fullName: 'Nhân Viên Điều Phối Demo',
    phone: '0901234500',
    role: 'STAFF',
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
  });

  const customer = await upsertUser({
    email: 'customer@demo.com',
    fullName: 'Nguyễn Văn Khách',
    phone: '0988888888',
    role: 'CUSTOMER',
  });

  const customer2 = await upsertUser({
    email: 'customer2@demo.com',
    fullName: 'Trần Minh Anh',
    phone: '0977777777',
    role: 'CUSTOMER',
  });

  const provider1 = await upsertUser({
    email: 'provider1@demo.com',
    fullName: 'Nguyễn Đức Cường - Chuyên Gia Điện Lạnh',
    phone: '0901234561',
    role: 'PROVIDER',
  });

  const provider2 = await upsertUser({
    email: 'provider2@demo.com',
    fullName: 'Trần Văn Hải - Kỹ Sư Điện Nước 24H',
    phone: '0901234562',
    role: 'PROVIDER',
  });

  const provider5 = await upsertUser({
    email: 'provider5@demo.com',
    fullName: 'CleanHouse - Công Ty Vệ Sinh Đô Thị',
    phone: '0901234565',
    role: 'PROVIDER',
  });

  await ensureAddress(customer.id, {
    label: 'Nhà riêng',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '123 Lê Lợi',
    latitude: 10.7769,
    longitude: 106.7009,
    isDefault: true,
  });
  await ensureAddress(customer2.id, {
    label: 'Nhà riêng',
    province: 'Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    addressDetail: '45 Nguyễn Đình Chiểu',
    latitude: 10.7829,
    longitude: 106.6891,
    isDefault: true,
  });

  await ensureProviderProfile(provider1.id, 1500000);
  await ensureProviderProfile(provider2.id, 800000);
  await ensureProviderProfile(provider5.id, 1200000);

  await ensureSystemSetting('commission_rate', JSON.stringify({ rate: 10 }));
  await ensureSystemSetting('featured_daily_rate', '30000');

  const tech = await upsertCategory('Dịch vụ Sửa chữa & Kỹ thuật', 1);
  const clean = await upsertCategory('Vệ sinh & Chăm sóc Nhà cửa', 1);
  const ac = await upsertCategory('Sửa chữa Điện lạnh', 2, tech.id);
  const electric = await upsertCategory('Sửa chữa Điện nước', 2, tech.id);
  const houseClean = await upsertCategory('Dọn dẹp nhà cửa', 2, clean.id);
  const sofa = await upsertCategory('Giặt Sofa, Đệm, Rèm', 2, clean.id);

  const acClean = await ensureService({
    providerId: provider1.id,
    categoryId: ac.id,
    name: 'Vệ sinh máy lạnh treo tường chuyên sâu',
    description:
      'Dịch vụ vệ sinh dàn nóng và dàn lạnh máy lạnh treo tường, hỗ trợ thông ống thoát nước và bảo dưỡng cơ bản.',
    imageUrl: '/images/ac_cleaning.png',
    referencePrice: 150000,
    items: [
      { name: 'Vệ sinh máy lạnh 1.0HP - 1.5HP', unit: 'Bộ', price: 150000 },
      { name: 'Vệ sinh máy lạnh 2.0HP - 2.5HP', unit: 'Bộ', price: 180000 },
    ],
  });

  const electricFix = await ensureService({
    providerId: provider2.id,
    categoryId: electric.id,
    name: 'Dò tìm rò rỉ điện nhảy aptomat chập nguồn âm tường',
    description:
      'Xử lý nhảy CB, chập ổ cắm, mất điện từng vùng tại gia đình bằng thiết bị đo chuyên dụng.',
    imageUrl: '/images/elec_leak.png',
    referencePrice: 250000,
    avgRating: 4.9,
    totalReviews: 32,
    items: [
      { name: 'Dò tìm vị trí chập điện âm tường', unit: 'Lần', price: 250000 },
      { name: 'Thay ổ cắm Panasonic chính hãng', unit: 'Cái', price: 120000 },
    ],
  });

  const cleaning = await ensureService({
    providerId: provider5.id,
    categoryId: houseClean.id,
    name: 'Dọn dẹp nhà cửa lau chùi sắp xếp theo giờ',
    description:
      'Dọn nhà định kỳ, lau sàn, rửa chén, thay ga đệm, lau kính căn hộ hoặc nhà phố.',
    imageUrl: '/images/house_cleaning.png',
    referencePrice: 75000,
    avgRating: 4.9,
    totalReviews: 45,
    items: [
      { name: 'Ca dọn dẹp cơ bản tối thiểu 3 giờ', unit: 'Giờ', price: 75000 },
      { name: 'Tổng vệ sinh nhà mới xây', unit: 'Mét vuông', price: 18000 },
    ],
  });

  const sofaClean = await ensureService({
    providerId: provider5.id,
    categoryId: sofa.id,
    name: 'Giặt ghế Sofa Đệm bông ép Rèm cửa sấy khô tại chỗ',
    description:
      'Giặt hấp khử khuẩn bằng hơi nước nóng, dung dịch an toàn cho trẻ nhỏ và thú cưng.',
    imageUrl: '/images/sofa_cleaning.png',
    referencePrice: 350000,
    avgRating: 4.8,
    totalReviews: 29,
    items: [
      { name: 'Giặt hơi nước sofa chữ L dưới 2.5m', unit: 'Bộ', price: 350000 },
      { name: 'Giặt đệm cao su size King', unit: 'Tấm', price: 300000 },
    ],
  });

  await ensureService({
    providerId: provider5.id,
    categoryId: clean.id,
    name: 'Phun khử khuẩn diệt côn trùng căn hộ',
    description: 'Dịch vụ chờ admin duyệt, dùng để demo moderation.',
    imageUrl: '/images/pest_control.png',
    status: 'PENDING',
    referencePrice: 420000,
    avgRating: 0,
    totalReviews: 0,
    items: [
      { name: 'Phun diệt côn trùng căn hộ dưới 80m2', unit: 'Căn', price: 420000 },
    ],
  });

  await ensureFeaturedListing({
    serviceId: acClean.id,
    providerId: provider1.id,
    startDate: daysFromNow(-2),
    endDate: daysFromNow(5),
    dailyRate: 30000,
    totalCost: 210000,
    status: 'ACTIVE',
  });
  await ensureFeaturedListing({
    serviceId: cleaning.id,
    providerId: provider5.id,
    startDate: daysFromNow(-10),
    endDate: daysFromNow(-1),
    dailyRate: 30000,
    totalCost: 270000,
    status: 'EXPIRED',
  });

  const address1 = {
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '123 Lê Lợi, Căn hộ A102',
  };
  const address2 = {
    province: 'Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    addressDetail: '45 Nguyễn Đình Chiểu',
  };

  const doneBooking = await ensureBooking({
    bookingCode: 'BK764129',
    customerId: customer.id,
    providerId: provider1.id,
    serviceId: acClean.id,
    description: 'Cần vệ sinh 2 máy treo tường gấp ở chung cư',
    address: address1,
    desiredTime: daysFromNow(-3),
    status: 'DONE',
    completedAt: hoursFromNow(-70),
    autoCompletedAt: daysFromNow(-2),
    items: [
      {
        name: 'Vệ sinh máy lạnh 1.0HP - 1.5HP',
        unit: 'Bộ',
        quantity: 2,
        priceSnapshot: 150000,
      },
    ],
    quotation: {
      actualPrice: 300000,
      commissionRateSnapshot: 10,
      estimatedTime: '1 giờ 30 phút',
      note: 'Đã hoàn thành sạch sẽ, thợ làm kỹ',
      items: [
        {
          name: 'Vệ sinh máy lạnh 1.0HP - 1.5HP',
          unit: 'Bộ',
          quantity: 2,
          price: 150000,
        },
      ],
    },
    histories: [
      {
        fromStatus: 'PENDING',
        toStatus: 'QUOTED',
        changedBy: provider1.id,
        note: 'Provider gửi báo giá',
      },
      {
        fromStatus: 'QUOTED',
        toStatus: 'CONFIRMED',
        changedBy: customer.id,
        note: 'Khách đồng ý báo giá',
      },
      {
        fromStatus: 'CONFIRMED',
        toStatus: 'IN_PROGRESS',
        changedBy: provider1.id,
        note: 'Provider bắt đầu xử lý',
      },
      {
        fromStatus: 'IN_PROGRESS',
        toStatus: 'DONE',
        changedBy: customer.id,
        note: 'Khách nghiệm thu hoàn tất',
      },
    ],
  });

  const progressBooking = await ensureBooking({
    bookingCode: 'BK924856',
    customerId: customer.id,
    providerId: provider2.id,
    serviceId: electricFix.id,
    description: 'Phòng bếp bị nhảy CB liên tục khi cắm lò vi sóng',
    address: address1,
    desiredTime: daysFromNow(1),
    status: 'IN_PROGRESS',
    providerAcceptedAt: hoursFromNow(-3),
    items: [
      {
        name: 'Dò tìm vị trí chập điện âm tường',
        unit: 'Lần',
        quantity: 1,
        priceSnapshot: 250000,
      },
    ],
    quotation: {
      actualPrice: 370000,
      commissionRateSnapshot: 10,
      estimatedTime: '2 giờ',
      note: 'Có phát sinh thay ổ cắm bị cháy.',
      items: [
        {
          name: 'Dò tìm vị trí chập điện âm tường',
          unit: 'Lần',
          quantity: 1,
          price: 250000,
        },
        {
          name: 'Thay ổ cắm Panasonic chính hãng',
          unit: 'Cái',
          quantity: 1,
          price: 120000,
        },
      ],
    },
    histories: [
      {
        fromStatus: 'PENDING',
        toStatus: 'QUOTED',
        changedBy: provider2.id,
        note: 'Provider báo giá phát sinh',
      },
      {
        fromStatus: 'QUOTED',
        toStatus: 'CONFIRMED',
        changedBy: customer.id,
        note: 'Khách xác nhận báo giá',
      },
      {
        fromStatus: 'CONFIRMED',
        toStatus: 'IN_PROGRESS',
        changedBy: provider2.id,
        note: 'Provider đang xử lý tại hiện trường',
      },
    ],
  });

  const disputeBooking = await ensureBooking({
    bookingCode: 'BK_DISPUTE1',
    customerId: customer2.id,
    providerId: provider5.id,
    serviceId: sofaClean.id,
    description: 'Giặt sofa chữ L nhưng sau khi khô vẫn còn vết ố ở tay ghế',
    address: address2,
    desiredTime: daysFromNow(-5),
    status: 'DISPUTED',
    providerAcceptedAt: daysFromNow(-5),
    completedAt: daysFromNow(-4),
    autoCompletedAt: daysFromNow(-3),
    items: [
      {
        name: 'Giặt hơi nước sofa chữ L dưới 2.5m',
        unit: 'Bộ',
        quantity: 1,
        priceSnapshot: 350000,
      },
    ],
    quotation: {
      actualPrice: 350000,
      commissionRateSnapshot: 10,
      estimatedTime: '2 giờ',
      note: 'Khách phản ánh còn vết ố sau khi khô.',
      items: [
        {
          name: 'Giặt hơi nước sofa chữ L dưới 2.5m',
          unit: 'Bộ',
          quantity: 1,
          price: 350000,
        },
      ],
    },
    histories: [
      {
        fromStatus: 'DONE',
        toStatus: 'DISPUTED',
        changedBy: customer2.id,
        note: 'Khách tạo khiếu nại còn vết ố trên sofa',
      },
    ],
  });

  const dispute = await ensureDispute({
    bookingId: disputeBooking.id,
    raisedBy: customer2.id,
    assignedTo: staff.id,
    reason: 'Sofa vẫn còn vết ố sau khi giặt, khách yêu cầu kiểm tra lại.',
  });

  const provider1Wallet = await prisma.providerWallet.findUniqueOrThrow({
    where: { providerId: provider1.id },
  });
  const provider2Wallet = await prisma.providerWallet.findUniqueOrThrow({
    where: { providerId: provider2.id },
  });
  const provider5Wallet = await prisma.providerWallet.findUniqueOrThrow({
    where: { providerId: provider5.id },
  });

  await ensureWalletTransaction({
    walletId: provider1Wallet.id,
    type: 'COMMISSION',
    amount: -30000,
    bookingId: doneBooking.id,
    status: 'SUCCESS',
    idempotencyKey: `seed:commission:${doneBooking.id}`,
    processedAt: daysFromNow(-3),
  });
  await ensureWalletTransaction({
    walletId: provider2Wallet.id,
    type: 'DEPOSIT',
    amount: 500000,
    status: 'SUCCESS',
    vnpayTxnRef: 'SEED_VNPAY_001',
    idempotencyKey: 'seed:vnpay:SEED_VNPAY_001',
    processedAt: daysFromNow(-7),
  });
  await ensureWalletTransaction({
    walletId: provider5Wallet.id,
    type: 'PENALTY',
    amount: -50000,
    bookingId: disputeBooking.id,
    disputeId: dispute.id,
    status: 'PENDING',
    idempotencyKey: `seed:dispute:${dispute.id}:penalty`,
  });

  await ensureManualDeposit({
    providerId: provider1.id,
    amount: 300000,
    transferCode: 'NAPVI-DEMO-001',
    receiptUrl: '/images/demo-transfer-receipt.png',
    status: 'PENDING',
  });
  await ensureWithdrawal({
    providerId: provider1.id,
    amount: 200000,
    bankName: 'Vietcombank',
    bankAccountNumber: '0123456789',
    bankAccountHolder: 'NGUYEN DUC CUONG',
    status: 'PENDING',
  });

  await ensureConversation({
    bookingId: doneBooking.id,
    serviceId: acClean.id,
    customerId: customer.id,
    providerId: provider1.id,
    messages: [
      {
        senderId: customer.id,
        senderType: 'CUSTOMER',
        content: 'Anh đến vệ sinh giúp em 2 máy lạnh vào chiều nay được không?',
        isRead: true,
      },
      {
        senderId: provider1.id,
        senderType: 'PROVIDER',
        content: 'Được anh/chị, em sẽ đến trong khung giờ 14h-15h.',
        isRead: true,
      },
    ],
  });

  await ensureChatbotSession(customer.id, acClean.id);

  await ensureNotification({
    userId: customer.id,
    type: 'BOOKING',
    title: 'Lịch hẹn đã hoàn tất',
    content: 'Booking BK764129 đã được nghiệm thu thành công.',
    referenceId: doneBooking.id,
    isRead: false,
  });
  await ensureNotification({
    userId: provider1.id,
    type: 'WALLET',
    title: 'Có yêu cầu rút tiền đang chờ xử lý',
    content: 'Yêu cầu rút 200.000đ đang chờ admin duyệt.',
    isRead: false,
  });
  await ensureNotification({
    userId: provider5.id,
    type: 'DISPUTE',
    title: 'Có khiếu nại cần phản hồi',
    content: 'Booking BK_DISPUTE1 đang được admin xem xét.',
    referenceId: dispute.id,
    isRead: false,
  });

  await ensureAuditLog({
    actorId: admin.id,
    action: 'STAFF_CREATED',
    targetType: 'User',
    targetId: staff.id,
    description: 'Tạo nhân viên điều phối demo với quyền booking/dispute/wallet/audit.',
    ipAddress: '127.0.0.1',
  });
  await ensureAuditLog({
    actorId: customer2.id,
    action: 'DISPUTE_CREATED',
    targetType: 'Dispute',
    targetId: dispute.id,
    description: 'Khách tạo khiếu nại còn vết ố sau khi giặt sofa.',
    ipAddress: '127.0.0.1',
  });

  console.log('Demo data is ready without deleting existing database data.');
  console.log(`Admin: admin@system.com / ${DEMO_PASSWORD}`);
  console.log(`Staff: staff@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Customer: customer@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Customer 2: customer2@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Provider 1: provider1@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Provider 2: provider2@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Provider 5: provider5@demo.com / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
