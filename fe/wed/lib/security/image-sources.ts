const TRUSTED_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'api.dicebear.com',
  'lh3.googleusercontent.com',
  'i.pravatar.cc',
]);

export const DEFAULT_SERVICE_IMAGE = '/images/service_repair.png';

export function isTrustedImageSrc(src?: string | null) {
  if (!src) return false;
  if (src.startsWith('/')) return true;

  try {
    const url = new URL(src);
    return url.protocol === 'https:' && TRUSTED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getSafeImageSrc(
  src?: string | null,
  fallback = DEFAULT_SERVICE_IMAGE,
): string {
  return isTrustedImageSrc(src) ? (src ?? fallback) : fallback;
}

export function getServiceFallbackImage(service?: {
  name?: string | null;
  category?: { name?: string | null } | null;
}) {
  const text = `${service?.name ?? ''} ${service?.category?.name ?? ''}`.toLowerCase();

  if (
    text.includes('vệ sinh') ||
    text.includes('dọn') ||
    text.includes('thông tắc') ||
    text.includes('diệt côn trùng') ||
    text.includes('giặt')
  ) {
    return '/images/service_cleaning.png';
  }

  if (
    text.includes('làm đẹp') ||
    text.includes('trang điểm') ||
    text.includes('tư vấn') ||
    text.includes('giáo dục')
  ) {
    return '/images/hero_bg.png';
  }

  return DEFAULT_SERVICE_IMAGE;
}

export function getSafeServiceImageSrc(
  src?: string | null,
  service?: { name?: string | null; category?: { name?: string | null } | null },
) {
  return getSafeImageSrc(src, getServiceFallbackImage(service));
}

export function sanitizeServiceImages<
  T extends {
    name?: string | null;
    category?: { name?: string | null } | null;
    images?: Array<{ imageUrl?: string | null }>;
  },
>(service: T, fallback = DEFAULT_SERVICE_IMAGE): T {
  if (!service.images?.length) return service;

  return {
    ...service,
    images: service.images.map((image) => ({
      ...image,
      imageUrl: getSafeImageSrc(image.imageUrl, fallback),
    })),
  };
}
