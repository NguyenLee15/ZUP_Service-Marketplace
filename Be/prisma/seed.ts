import { PrismaClient, BookingStatus, ServiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.review.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.disputeEvidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.bookingAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceImage.deleteMany();
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

  console.log('Seeding new data...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@system.com', password: passwordHash, fullName: 'System Admin', role: 'ADMIN', status: 'ACTIVE', emailVerified: true,
    }
  });

  const providers = [];
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.user.create({
      data: {
        email: `provider${i}@demo.com`, password: passwordHash, fullName: `Provider ${i} - Chuyên Nghiệp`, phone: `090000000${i}`,
        role: 'PROVIDER', status: 'ACTIVE', emailVerified: true,
        kycProfiles: { create: { cccdFrontUrl: 'https://via.placeholder.com/400x250', cccdBackUrl: 'https://via.placeholder.com/400x250', portraitUrl: 'https://via.placeholder.com/200x200', status: 'APPROVED' } },
        providerWallet: { create: { balance: 1000000 * i } }
      }
    });
    providers.push(p);
  }

  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com', password: passwordHash, fullName: 'Nguyễn Văn Khách', phone: '0988888888', role: 'CUSTOMER', status: 'ACTIVE', emailVerified: true,
      addresses: { create: { province: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé', addressDetail: '123 Lê Lợi', latitude: 10.7769, longitude: 106.7009, isDefault: true } }
    }
  });

  // 2. Create Categories (10+ categories)
  const categorySpecs = [
    { name: 'Dịch vụ Nhà cửa', children: ['Vệ sinh máy lạnh', 'Sửa điện nước', 'Thông tắc bồn cầu', 'Diệt côn trùng'] },
    { name: 'Chăm sóc Cá nhân', children: ['Cắt tóc tại nhà', 'Trang điểm tiệc', 'Massage trị liệu'] },
    { name: 'Dịch vụ Kỹ thuật', children: ['Sửa máy tính', 'Lắp đặt Camera', 'Sửa thiết bị gia dụng'] },
  ];

  const subCategories = [];
  for (const spec of categorySpecs) {
    const parent = await prisma.serviceCategory.create({
      data: { name: spec.name, level: 1 }
    });
    for (const childName of spec.children) {
      const child = await prisma.serviceCategory.create({
        data: { name: childName, level: 2, parentId: parent.id }
      });
      subCategories.push(child);
    }
  }

  // 3. Create Services (30 services)
  const serviceTemplates = [
    { prefix: 'Vệ sinh', suffix: 'tận tâm, sạch bóng', price: 150000 },
    { prefix: 'Sửa chữa', suffix: 'nhanh chóng, giá rẻ', price: 250000 },
    { prefix: 'Lắp đặt', suffix: 'chuyên nghiệp, bảo hành', price: 500000 },
    { prefix: 'Bảo trì', suffix: 'định kỳ, an tâm', price: 300000 },
    { prefix: 'Khử khuẩn', suffix: 'an toàn sức khỏe', price: 450000 },
    { prefix: 'Nâng cấp', suffix: 'tối ưu hiệu suất', price: 800000 },
  ];

  const serviceImages = [
    'https://images.unsplash.com/photo-1558403194-611308249627?w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80',
  ];

  console.log('Creating 30 services...');
  for (let i = 0; i < 30; i++) {
    const category = subCategories[i % subCategories.length];
    const template = serviceTemplates[i % serviceTemplates.length];
    const provider = providers[i % providers.length];
    
    await prisma.service.create({
      data: {
        providerId: provider.id,
        categoryId: category.id,
        name: `${template.prefix} ${category.name} ${i + 1}`,
        description: `Dịch vụ ${category.name.toLowerCase()} chất lượng cao, ${template.suffix}. Đội ngũ tay nghề cao với hơn 5 năm kinh nghiệm. Cam kết hài lòng 100%.`,
        referencePrice: template.price + (i * 1000),
        status: 'ACTIVE',
        avgRating: 4.0 + (Math.random() * 1.0),
        totalReviews: Math.floor(Math.random() * 50),
        images: {
          create: {
            imageUrl: serviceImages[i % serviceImages.length],
            cloudinaryId: `demo_img_${i}`,
          }
        }
      }
    });
  }

  // 4. Mock some bookings
  console.log('Creating some mock bookings...');
  const activeServices = await prisma.service.findMany({ take: 5, where: { status: 'ACTIVE' } });
  for (let i = 0; i < 5; i++) {
    await prisma.booking.create({
      data: {
        bookingCode: `BK${Math.floor(100000 + Math.random() * 900000)}`,
        customerId: customer.id,
        providerId: activeServices[i].providerId,
        serviceId: activeServices[i].id,
        description: `Yêu cầu dịch vụ số ${i + 1}`,
        province: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé', addressDetail: '99 Lê Lợi',
        desiredTime: new Date(),
        status: i % 2 === 0 ? 'DONE' : 'IN_PROGRESS',
        quotation: { create: { actualPrice: Number(activeServices[i].referencePrice) + 50000, commissionRateSnapshot: 10, estimatedTime: '2 giờ' } }
      }
    });
  }

  console.log('Demo data seeded successfully!');
  console.log('--- Credentials ---');
  console.log('Admin: admin@system.com / password123');
  console.log('Customer: customer@demo.com / password123');
  console.log('Provider: provider1@demo.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
