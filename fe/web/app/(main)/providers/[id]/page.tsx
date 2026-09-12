import { Metadata } from 'next';
import { ProviderProfileClient } from './ProviderProfileClient';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function getProviderProfile(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/services/providers/${id}`, { 
      next: { revalidate: 60 } // Cache 60s
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProviderProfile(id);

  if (!provider) {
    return {
      title: 'Không tìm thấy Nhà cung cấp | ZUP',
      description: 'Nhà cung cấp này không tồn tại hoặc tài khoản đã bị khóa.',
    };
  }

  const title = `Hồ sơ Đối tác ${provider.fullName} | ZUP`;
  const addressStr = provider.address 
    ? `${provider.address.ward}, ${provider.address.district}, ${provider.address.province}`
    : 'đối tác uy tín';
  const description = `Khám phá các dịch vụ chất lượng cao được cung cấp bởi thợ ${provider.fullName} tại ${addressStr}. Đánh giá trung bình ${provider.stats.avgRating}⭐ (${provider.stats.totalReviews} lượt đánh giá).`;
  const defaultImage = '/images/hero_bg.png';
  const imageUrl = provider.avatarUrl || defaultImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://zup.vn/providers/${id}`,
      siteName: 'ZUP',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: provider.fullName,
        },
      ],
      locale: 'vi_VN',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getProviderProfile(id);

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-pale-gray text-action-blue rounded-full flex items-center justify-center text-4xl mb-4">
          🔍
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Không tìm thấy Đối tác</h1>
        <p className="text-muted-foreground max-w-md">
          Nhà cung cấp dịch vụ này hiện không trực tuyến, tài khoản đã bị khóa hoặc không tồn tại trong hệ thống.
        </p>
      </div>
    );
  }

  return <ProviderProfileClient provider={provider} />;
}
