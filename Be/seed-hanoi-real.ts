import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HANOI_CENTER_LAT = 21.0285;
const HANOI_CENTER_LNG = 105.8522;

const REAL_CATEGORIES = [
  {
    name: 'Sửa chữa',
    icon: 'wrench',
    sub: [
      { name: 'Sửa điện nước', images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', 'https://images.unsplash.com/photo-1581092590082-d04b77f98e85?w=800&q=80'] },
      { name: 'Sửa máy lạnh', images: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80', 'https://images.unsplash.com/photo-1542013936693-884638332954?w=800&q=80'] },
      { name: 'Sửa đồ điện gia dụng', images: ['https://images.unsplash.com/photo-1558384462-81c03e878345?w=800&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'] }
    ]
  },
  {
    name: 'Vệ sinh',
    icon: 'sparkles',
    sub: [
      { name: 'Giúp việc nhà', images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', 'https://images.unsplash.com/photo-1527515637462-8f69bce4e1b6?w=800&q=80'] },
      { name: 'Vệ sinh máy lạnh', images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80', 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80'] },
      { name: 'Giặt sô-pha', images: ['https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&q=80', 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80'] }
    ]
  },
  {
    name: 'Vận chuyển',
    icon: 'truck',
    sub: [
      { name: 'Chuyển nhà trọn gói', images: ['https://images.unsplash.com/photo-1600518464441-5e5d16599b4d?w=800&q=80', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'] },
      { name: 'Bốc xếp hàng hóa', images: ['https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80', 'https://images.unsplash.com/photo-1512418490979-92798cec1380?w=800&q=80'] }
    ]
  },
  {
    name: 'Xe cộ',
    icon: 'car',
    sub: [
      { name: 'Cứu hộ ắc quy', images: ['https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&q=80', 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80'] },
      { name: 'Vá lốp ô tô/xe máy', images: ['https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80', 'https://images.unsplash.com/photo-1563200913-c15c2dffc279?w=800&q=80'] }
    ]
  },
  {
    name: 'Làm đẹp',
    icon: 'flower', // We don't use the exact lucide names here, frontend will map them, but giving a logical name
    sub: [
      { name: 'Spa tại nhà', images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'] },
      { name: 'Làm móng', images: ['https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80', 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=800&q=80'] },
      { name: 'Cắt tóc', images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'] }
    ]
  },
  {
    name: 'Mẹ & Bé',
    icon: 'baby',
    sub: [
      { name: 'Tắm bé sơ sinh', images: ['https://images.unsplash.com/photo-1555252836-3908c691316b?w=800&q=80', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80'] },
      { name: 'Chăm sóc sau sinh', images: ['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80', 'https://images.unsplash.com/photo-1523365280197-f1c1f964811a?w=800&q=80'] }
    ]
  },
  {
    name: 'Thú cưng',
    icon: 'paw',
    sub: [
      { name: 'Tắm tỉa lông', images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80'] },
      { name: 'Dắt chó đi dạo', images: ['https://images.unsplash.com/photo-1584362145328-98f596812838?w=800&q=80', 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&q=80'] }
    ]
  },
  {
    name: 'Nấu ăn',
    icon: 'utensils',
    sub: [
      { name: 'Nấu tiệc tại nhà', images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=800&q=80'] },
      { name: 'Nấu ăn hàng ngày', images: ['https://images.unsplash.com/photo-1498837167922-41c53b4f0f14?w=800&q=80', 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80'] }
    ]
  }
];

const HANOI_DISTRICTS = [
  { p: 'Hà Nội', d: 'Quận Cầu Giấy', w: 'Phường Dịch Vọng', a: 'Xuân Thủy', lat: 21.036, lng: 105.798 },
  { p: 'Hà Nội', d: 'Quận Đống Đa', w: 'Phường Trung Liệt', a: 'Thái Hà', lat: 21.012, lng: 105.820 },
  { p: 'Hà Nội', d: 'Quận Thanh Xuân', w: 'Phường Thanh Xuân Trung', a: 'Nguyễn Trãi', lat: 20.993, lng: 105.804 },
  { p: 'Hà Nội', d: 'Quận Hai Bà Trưng', w: 'Phường Bách Khoa', a: 'Tạ Quang Bửu', lat: 21.004, lng: 105.845 },
  { p: 'Hà Nội', d: 'Quận Hà Đông', w: 'Phường Văn Quán', a: 'Trần Phú', lat: 20.975, lng: 105.789 }
];

async function main() {
  console.log('Clearing old mocked data...');
  await prisma.review.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.disputeEvidence.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.bookingStatusHistory.deleteMany({});
  await prisma.bookingAttachment.deleteMany({});
  await prisma.bookingItem.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.serviceImage.deleteMany({});
  await prisma.featuredListing.deleteMany({});
  await prisma.serviceItem.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceCategory.deleteMany({});

  console.log('Seeding new nested categories...');
  const categoryMap: Record<string, number> = {}; // subCatName -> id

  for (const pCat of REAL_CATEGORIES) {
    const parent = await prisma.serviceCategory.create({
      data: { name: pCat.name },
    });
    
    for (const sCat of pCat.sub) {
      const sub = await prisma.serviceCategory.create({
        data: {
          name: sCat.name,
          parentId: parent.id,
        }
      });
      categoryMap[sCat.name] = sub.id;
    }
  }

  console.log('Seeding providers and realistic services...');
  const passwordHash = await bcrypt.hash('12345678', 10);

  let providerIndex = 1;

  for (const pCat of REAL_CATEGORIES) {
    for (const sCat of pCat.sub) {
      // Create a provider specifically for this subcategory
      const loc = HANOI_DISTRICTS[providerIndex % HANOI_DISTRICTS.length];
      const email = `tho_${providerIndex}_${Date.now()}@gmail.com`;

      const provider = await prisma.user.create({
        data: {
          fullName: `Chuyên gia ${sCat.name} ${providerIndex}`,
          email: email,
          password: passwordHash,
          role: 'PROVIDER',
          status: 'ACTIVE',
          providerWallet: {
            create: {
              balance: 1500000,
              isRestricted: false,
            }
          },
          addresses: {
            create: {
              province: loc.p,
              district: loc.d,
              ward: loc.w,
              addressDetail: loc.a,
              latitude: loc.lat + (Math.random() - 0.5) * 0.05,
              longitude: loc.lng + (Math.random() - 0.5) * 0.05,
              isDefault: true,
            }
          }
        }
      });

      // Create service
      const price = Math.floor(Math.random() * 8 + 2) * 50000; // 100k - 500k
      const serviceName = `Dịch vụ ${sCat.name.toLowerCase()} tận tâm, nhanh chóng`;
      
      const newService = await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: categoryMap[sCat.name],
          name: serviceName,
          description: `Chúng tôi cung cấp dịch vụ ${sCat.name.toLowerCase()} với đội ngũ thợ lành nghề, trang thiết bị hiện đại. Đảm bảo đúng giờ, không phát sinh chi phí ẩn. Hỗ trợ khu vực Hà Nội 24/7.`,
          referencePrice: price,
          status: 'ACTIVE',
          avgRating: (Math.random() * 1 + 4).toFixed(1), // 4.0 - 5.0
          totalReviews: Math.floor(Math.random() * 150) + 10,
        }
      });

      // Attach real Unsplash images
      for (const imgUrl of sCat.images) {
        await prisma.serviceImage.create({
          data: {
            serviceId: newService.id,
            imageUrl: imgUrl,
            cloudinaryId: 'unsplash_' + Date.now() + Math.random(),
          }
        });
      }

      // Attach Service Items
      const itemNames = [
        `Gói ${sCat.name} cơ bản`,
        `Gói ${sCat.name} nâng cao`,
        `Kiểm tra/Khảo sát tận nơi`
      ];
      
      for (const [idx, itemName] of itemNames.entries()) {
        await prisma.serviceItem.create({
          data: {
            serviceId: newService.id,
            name: itemName,
            unit: idx === 2 ? 'Lần' : 'Gói',
            price: Math.floor(price * (0.8 + idx * 0.4)),
          }
        });
      }

      console.log(`Created service: ${serviceName} by ${provider.fullName}`);
      providerIndex++;
    }
  }

  console.log('Finished seeding real data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
