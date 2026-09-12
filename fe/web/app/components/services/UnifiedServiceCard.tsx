'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  GitCompare,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  CheckCircle,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSafeServiceImageSrc } from '@/lib/security/image-sources';
import { Service } from '@/types';

interface UnifiedServiceCardProps {
  service: Service;
  priority?: boolean;
  isFavorite?: boolean;
  isComparing?: boolean;
  showFavorite?: boolean;
  showCompare?: boolean;
  showQuickView?: boolean;
  showDescription?: boolean;
  showSponsoredBadge?: boolean;
  showTrustBadges?: boolean;
  showPrimaryAction?: boolean;
  useImageCarousel?: boolean;
  priceMode?: 'from' | 'estimate';
  onToggleFavorite?: (service: Service) => void;
  onAddToComparison?: (service: Service) => void;
  onQuickView?: (service: Service) => void;
  onRecentlyViewed?: (service: Service) => void;
}

const formatPrice = (price: string | number | undefined) => {
  const normalizedPrice = Number(price) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(normalizedPrice);
};

const formatCompactCount = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value < 10000 ? 1 : 0).replace('.', ',')}k`;
  }

  return String(value);
};

const HOME_FALLBACK_IMAGES = [
  '/images/service_cleaning.webp',
  '/images/service_repair.webp',
  '/images/hero_bg.webp',
];

export function UnifiedServiceCardSkeleton() {
  return (
    <Card className="surface-card h-full gap-0 overflow-hidden rounded-2xl py-0">
      <div className="aspect-[16/9] w-full shimmer" />
      <CardContent className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-5 w-16 rounded-full shimmer" />
          <div className="h-4 w-14 rounded shimmer" />
        </div>
        <div className="mb-2 h-5 w-4/5 rounded shimmer" />
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          <div className="h-7 flex-1 rounded shimmer" />
          <div className="h-9 w-24 rounded-lg shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedServiceCard({
  service,
  priority = false,
  isFavorite = false,
  isComparing = false,
  showFavorite = true,
  showCompare = false,
  showQuickView = false,
  showDescription = true,
  showSponsoredBadge = false,
  showTrustBadges = false,
  showPrimaryAction = false,
  useImageCarousel = false,
  onToggleFavorite,
  onAddToComparison,
  onQuickView,
  onRecentlyViewed,
}: UnifiedServiceCardProps) {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const serviceImages = service.images?.length
    ? service.images.map((image) => getSafeServiceImageSrc(image.imageUrl, service))
    : [];
  const images = serviceImages.length > 0 ? serviceImages : useImageCarousel ? HOME_FALLBACK_IMAGES : [];
  const imageUrl = images[activeImageIndex % Math.max(images.length, 1)];
  const detailHref = `/services/${service.id}`;
  const rating = Number(service.avgRating || 0).toFixed(1);
  const totalReviews = service.totalReviews || 0;
  const basePrice = Number(service.referencePrice || 0);
  const displayPrice = formatPrice(basePrice).replace('₫', 'đ');
  const salesCount =
    (service as Service & {
      totalCompleted?: number;
      totalBookings?: number;
      soldCount?: number;
      bookingCount?: number;
    }).soldCount ??
    (service as Service & { totalCompleted?: number }).totalCompleted ??
    (service as Service & { totalBookings?: number }).totalBookings ??
    (service as Service & { bookingCount?: number }).bookingCount ??
    totalReviews;

  const handleDetailClick = () => {
    onRecentlyViewed?.(service);
  };

  // Use single primary image to ensure zero-jank 60fps scrolling and eliminate interval re-renders

  return (
    <Card
      className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-2xl py-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-200 hover:shadow-md hover:border-sky-500/40 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link 
          href={detailHref}
          prefetch={false}
          onClick={handleDetailClick}
          className="block h-full w-full cursor-pointer"
          aria-label={`Xem chi tiết dịch vụ ${service.name}`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={service.name}
              width={500}
              height={375}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 22vw"
              priority={priority}
              quality={65}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Wrench className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </Link>

        <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex max-w-[calc(100%-4rem)] flex-col items-start gap-1">
          {showSponsoredBadge && (
            <Badge className="border-0 bg-amber-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-950 shadow-sm px-1.5 sm:px-2 py-0.5">
              <Sparkles className="mr-1 h-2.5 w-2.5" />
              Tài trợ
            </Badge>
          )}
          <Badge className="max-w-full truncate border-0 bg-slate-950/75 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white backdrop-blur-md">
            {service.category?.name || 'Dịch vụ'}
          </Badge>
        </div>

        {(showFavorite || showCompare) && (
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex flex-col gap-1.5">
            {showFavorite && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={isFavorite ? `Bỏ ${service.name} khỏi yêu thích` : `Thêm ${service.name} vào yêu thích`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleFavorite?.(service);
                }}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-0 p-0 shadow-md backdrop-blur-md transition-[background-color,color,transform] flex items-center justify-center ${
                  isFavorite
                    ? 'bg-rose-500 text-white ring-2 ring-rose-300/35'
                    : 'border border-white/20 bg-slate-950/55 text-white hover:bg-sky-600 hover:text-white'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? 'fill-white' : ''}`} />
              </Button>
            )}
            {showCompare && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={isComparing ? `${service.name} đã có trong so sánh` : `Thêm ${service.name} vào so sánh`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAddToComparison?.(service);
                }}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-0 p-0 shadow-md backdrop-blur-md transition-[background-color,color,transform] flex items-center justify-center ${
                  isComparing
                    ? 'bg-sky-600 text-white ring-2 ring-sky-300/35'
                    : 'border border-white/20 bg-slate-950/55 text-white hover:bg-sky-600 hover:text-white'
                }`}
              >
                <GitCompare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        )}

        {(service.distanceKm ?? service.distance) !== undefined && (
          <Badge className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 border-0 bg-slate-950/75 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-white backdrop-blur-md">
            {(service.distanceKm ?? service.distance)?.toFixed(1)} km
          </Badge>
        )}

        {showTrustBadges && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/75 px-1.5 py-0.5 text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">Đang hoạt động</span>
          </div>
        )}

        {showQuickView && onQuickView && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-midnight-indigo/90 via-midnight-indigo/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onQuickView(service);
              }}
              className="rounded-full border border-white/30 bg-white/20 px-6 font-bold text-white backdrop-blur-md transition-[background-color,color] duration-200 hover:bg-white hover:text-slate-900"
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem nhanh
            </Button>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="flex-1">
          <Link href={detailHref} prefetch={false} onClick={handleDetailClick} className="block">
            <h3
              title={service.name}
              className="line-clamp-2 min-h-[2.35rem] text-sm sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 text-pretty transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400 leading-tight break-words [overflow-wrap:anywhere]"
            >
              {service.name}
            </h3>
          </Link>
          {showDescription && (
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground text-pretty break-words [overflow-wrap:anywhere]">
              {service.description || 'Dịch vụ uy tín được cung cấp bởi đối tác chuyên nghiệp của ZUP.'}
            </p>
          )}
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] sm:text-[11px] leading-tight">
            {service.provider?.id ? (
              <Link
                href={`/providers/${service.provider.id}`}
                onClick={(e) => e.stopPropagation()}
                title={`Xem hồ sơ của ${service.provider.fullName}`}
                aria-label={`Xem hồ sơ của ${service.provider.fullName} cung cấp dịch vụ ${service.name}`}
                className="min-w-0 flex-1 truncate font-medium text-foreground/75 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors"
              >
                {service.provider.fullName}
              </Link>
            ) : (
              <p
                title={service.provider?.fullName || 'Đối tác ZUP'}
                className="min-w-0 flex-1 truncate font-medium text-foreground/75"
              >
                {service.provider?.fullName || 'Đối tác ZUP'}
              </p>
            )}
            {showTrustBadges && (
              <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-slate-700 dark:text-slate-300">
                Uy tín
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex min-w-0 items-end justify-between gap-2 pt-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm sm:text-base font-extrabold leading-tight text-sky-600 dark:text-sky-400 tabular-nums">
              Từ {displayPrice}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] sm:text-[11px] leading-none text-foreground/80">
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <span className="shrink-0 font-medium">{rating}</span>
              {salesCount > 0 ? (
                <>
                  <span className="mx-1 text-slate-400/50 dark:text-slate-600">•</span>
                  <span className="truncate">Lượt đặt {formatCompactCount(salesCount)}</span>
                </>
              ) : (
                <>
                  <span className="mx-1 text-slate-400/50 dark:text-slate-600">•</span>
                  <span className="truncate text-sky-500">Mới</span>
                </>
              )}
            </div>
          </div>
          {showPrimaryAction && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDetailClick();
                router.push(detailHref);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 transition-colors hover:bg-sky-500 hover:text-white sm:h-9 sm:w-9 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label={`Đặt ngay dịch vụ ${service.name}`}
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
