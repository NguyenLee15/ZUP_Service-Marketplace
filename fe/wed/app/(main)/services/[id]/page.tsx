import { Metadata } from 'next';
import { ServiceDetailClient } from './ServiceDetailClient';
import {
  DEFAULT_SERVICE_IMAGE,
  getServiceFallbackImage,
  getSafeImageSrc,
  sanitizeServiceImages,
} from '@/lib/security/image-sources';

// Server-side fetch — gọi trực tiếp BE qua env var server-only
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Hàm gọi API trên Server (Có áp dụng Caching của Next.js)
async function getServiceDetail(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/services/${id}`, { 
      next: { revalidate: 60 } // Cache 60s để giảm tải Backend
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    return null;
  }
}

// Hàm render thẻ Meta (SEO) tự động (Dynamic Metadata)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceDetail(id);

  if (!service) {
    return {
      title: 'Không tìm thấy dịch vụ | Zup',
      description: 'Dịch vụ này không tồn tại hoặc đã bị xóa khỏi hệ thống.',
    };
  }

  const title = `${service.name} - ${service.provider?.fullName} | Zup`;
  const description = service.description?.substring(0, 150) + '...' || 'Khám phá ngay dịch vụ uy tín trên nền tảng Zup.';
  const defaultImage = '/images/hero_bg.png';
  const imageUrl = getSafeImageSrc(service.images?.[0]?.imageUrl, defaultImage);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://zup.vn/services/${id}`,
      siteName: 'Zup',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: service.name,
        },
      ],
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// Server Component (Rất nhẹ và nhanh)
export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Lấy dữ liệu ngay trên Server trước khi trả HTML về cho Client
  const service = await getServiceDetail(id);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-pale-gray text-action-blue rounded-full flex items-center justify-center text-4xl mb-4">
          🔍
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Không tìm thấy dịch vụ</h1>
        <p className="text-muted-foreground max-w-md">
          Dịch vụ bạn đang tìm kiếm có thể đã bị ẩn, tạm ngưng hoặc không tồn tại.
        </p>
      </div>
    );
  }

  // Truyền dữ liệu vào Client Component để render UI tương tác
  return (
    <ServiceDetailClient
      service={sanitizeServiceImages(
        service,
        getServiceFallbackImage(service) || DEFAULT_SERVICE_IMAGE,
      )}
    />
  );
}
