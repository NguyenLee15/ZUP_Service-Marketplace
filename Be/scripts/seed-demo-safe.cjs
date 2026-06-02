const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'password123';

async function upsertUser({ email, fullName, phone, role }) {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      phone,
      role,
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
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
}

async function upsertCategory(name, level, parentId) {
  return prisma.serviceCategory.upsert({
    where: { name },
    update: { level, parentId, isDeleted: false },
    create: { name, level, parentId },
  });
}

async function ensureProviderProfile(providerId) {
  await prisma.providerWallet.upsert({
    where: { providerId },
    update: { balance: 1500000, isRestricted: false },
    create: { providerId, balance: 1500000, isRestricted: false },
  });

  const existingKyc = await prisma.kycProfile.findFirst({
    where: { providerId },
    select: { id: true },
  });

  const data = {
    cccdFrontUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
    cccdBackUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&q=80',
    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    status: 'APPROVED',
  };

  if (existingKyc) {
    await prisma.kycProfile.update({ where: { id: existingKyc.id }, data });
  } else {
    await prisma.kycProfile.create({ data: { providerId, ...data } });
  }
}

async function ensureCustomerAddress(userId) {
  const count = await prisma.userAddress.count({ where: { userId } });
  if (count > 0) return;

  await prisma.userAddress.create({
    data: {
      userId,
      label: 'Nhà riêng',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressDetail: '123 Lê Lợi',
      latitude: 10.7769,
      longitude: 106.7009,
      isDefault: true,
    },
  });
}

async function ensureService({ providerId, categoryId, name, description, imageUrl }) {
  const data = {
    providerId,
    categoryId,
    name,
    description,
    referencePrice: 150000,
    status: 'ACTIVE',
    avgRating: 4.8,
    totalReviews: 24,
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
    data: [
      {
        serviceId: service.id,
        name: 'Vệ sinh cơ bản',
        unit: 'Lần',
        price: 150000,
      },
      {
        serviceId: service.id,
        name: 'Bảo dưỡng chuyên sâu',
        unit: 'Lần',
        price: 250000,
      },
    ],
  });

  return service;
}

async function main() {
  const customer = await upsertUser({
    email: 'customer@demo.com',
    fullName: 'Nguyễn Văn Khách',
    phone: '0988888888',
    role: 'CUSTOMER',
  });

  const provider = await upsertUser({
    email: 'provider1@demo.com',
    fullName: 'Nguyễn Đức Cường - Chuyên Gia Điện Lạnh',
    phone: '0901234561',
    role: 'PROVIDER',
  });

  await ensureCustomerAddress(customer.id);
  await ensureProviderProfile(provider.id);

  const rootCategory = await upsertCategory('Dịch vụ Sửa chữa & Kỹ thuật', 1, null);
  const childCategory = await upsertCategory('Sửa chữa Điện lạnh', 2, rootCategory.id);

  await ensureService({
    providerId: provider.id,
    categoryId: childCategory.id,
    name: 'Vệ sinh máy lạnh treo tường chuyên sâu',
    description:
      'Dịch vụ vệ sinh dàn nóng và dàn lạnh máy lạnh treo tường, hỗ trợ thông ống thoát nước và bảo dưỡng cơ bản.',
    imageUrl: '/images/ac_cleaning.png',
  });

  await prisma.systemSetting.upsert({
    where: { key: 'featured_daily_rate' },
    update: { value: '10000' },
    create: { key: 'featured_daily_rate', value: '10000' },
  });

  console.log('Demo data is ready.');
  console.log(`Customer: customer@demo.com / ${DEMO_PASSWORD}`);
  console.log(`Provider: provider1@demo.com / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
