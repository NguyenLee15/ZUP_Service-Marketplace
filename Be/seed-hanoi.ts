import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HANOI_CENTER_LAT = 21.0285;
const HANOI_CENTER_LNG = 105.8522;

const CATEGORIES = [
  'Sửa chữa điện nước',
  'Giúp việc nhà',
  'Vệ sinh máy lạnh',
  'Sửa chữa điện lạnh',
  'Sửa khóa',
  'Diệt côn trùng'
];

async function main() {
  console.log('Starting seed for Hanoi services...');
  const passwordHash = await bcrypt.hash('12345678', 10);

  // 1. Ensure categories exist
  const categoryIds = [];
  for (const catName of CATEGORIES) {
    let cat = await prisma.serviceCategory.findFirst({ where: { name: catName } });
    if (!cat) {
      cat = await prisma.serviceCategory.create({
        data: { name: catName },
      });
    }
    categoryIds.push(cat.id);
  }

  // 2. Create 5 Providers in Hanoi
  for (let i = 1; i <= 5; i++) {
    const lat = HANOI_CENTER_LAT + (Math.random() - 0.5) * 0.1;
    const lng = HANOI_CENTER_LNG + (Math.random() - 0.5) * 0.1;
    
    const email = `hanoi_provider_${i}_${Date.now()}@example.com`;

    const provider = await prisma.user.create({
      data: {
        fullName: `Thợ Hà Nội ${i}`,
        email: email,
        password: passwordHash,
        role: 'PROVIDER',
        status: 'ACTIVE',
        providerWallet: {
          create: {
            balance: 1000000,
            isRestricted: false,
          }
        },
        addresses: {
          create: {
            province: 'Hà Nội',
            district: 'Quận Cầu Giấy', // Example
            ward: 'Phường Dịch Vọng',
            addressDetail: `Ngõ ${i * 10} Cầu Giấy`,
            latitude: lat,
            longitude: lng,
            isDefault: true,
          }
        }
      }
    });

    console.log(`Created provider: ${provider.fullName} at lat: ${lat}, lng: ${lng}`);

    // 3. Create 4 services for each provider
    for (let j = 1; j <= 4; j++) {
      const catId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const serviceName = `${CATEGORIES[categoryIds.indexOf(catId)]} Chuyên Nghiệp ${i}-${j}`;
      const price = Math.floor(Math.random() * 500000) + 100000;

      await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: catId,
          name: serviceName,
          description: `Dịch vụ ${serviceName} uy tín, chất lượng tại Hà Nội. Phục vụ 24/7.`,
          referencePrice: price,
          status: 'ACTIVE',
          avgRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 -> 5.0
          totalReviews: Math.floor(Math.random() * 100) + 5,
        }
      });
      console.log(`  - Created service: ${serviceName}`);
    }
  }

  console.log('Successfully seeded 20 services in Hanoi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
