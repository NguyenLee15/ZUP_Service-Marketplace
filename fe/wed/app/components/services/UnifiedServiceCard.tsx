'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  Diamond,
  Eye,
  GitCompare,
  Heart,
  Shield,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Service } from '@/types';

interface UnifiedServiceCardProps {
  service: Service;
  priority?: boolean;
  isFavorite?: boolean;
  isComparing?: boolean;
  showFavorite?: boolean;
  showCompare?: boolean;
  showQuickView?: boolean;
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

const HOME_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a268e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=800',
];

export function UnifiedServiceCardSkeleton() {
  return (
    <Card className="surface-card h-full gap-0 overflow-hidden rounded-[20px] py-0">
      <div className="aspect-[4/3] w-full shimmer" />
      <CardContent className="flex flex-1 flex-col p-3 sm:p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-20 rounded-full shimmer" />
          <div className="h-4 w-16 rounded shimmer" />
        </div>
        <div className="mb-3 h-6 w-4/5 rounded shimmer" />
        <div className="mb-2 h-4 w-full rounded shimmer" />
        <div className="mb-6 h-4 w-5/6 rounded shimmer" />
        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-5">
          <div className="h-8 w-28 rounded shimmer" />
          <div className="h-8 w-24 rounded shimmer" />
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
  showSponsoredBadge = false,
  showTrustBadges = false,
  showPrimaryAction = false,
  useImageCarousel = false,
  priceMode = 'from',
  onToggleFavorite,
  onAddToComparison,
  onQuickView,
  onRecentlyViewed,
}: UnifiedServiceCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const serviceImages = service.images?.length ? service.images.map((image) => image.imageUrl) : [];
  const images = serviceImages.length > 0 ? serviceImages : useImageCarousel ? HOME_FALLBACK_IMAGES : [];
  const imageUrl = images[activeImageIndex % Math.max(images.length, 1)];
  const detailHref = `/services/${service.id}`;
  const rating = Number(service.avgRating || 0).toFixed(1);
  const totalReviews = service.totalReviews || 0;
  const providerInitial = service.provider?.fullName?.charAt(0) || '?';
  const showElite = Number(service.avgRating || 0) >= 4.8;
  const basePrice = Number(service.referencePrice || 0);
  const fullEstimatePrice = `${formatPrice(basePrice).replace('₫', '').trim()} - ${formatPrice(basePrice * 1.5)}`;

  const handleDetailClick = () => {
    onRecentlyViewed?.(service);
  };

  useEffect(() => {
    if (!useImageCarousel || !isHovered || images.length <= 1) {
      setActiveImageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [images.length, isHovered, useImageCarousel]);

  return (
    <Card
      className="surface-card group relative flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-[20px] py-0 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-action-blue/30 hover:shadow-[var(--brand-shadow-card)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={detailHref} prefetch={false} onClick={handleDetailClick} className="block h-full w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={service.name}
              width={500}
              height={375}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 22vw"
              priority={priority}
              quality={65}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ viewTransitionName: `service-image-${service.id}` } as any}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Wrench className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </Link>

        {useImageCarousel && images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
            {images.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-300 ${
                  index === activeImageIndex % images.length ? 'scale-125 bg-white' : 'bg-white/45'
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute left-3 top-3 sm:left-4 sm:top-4 flex max-w-[calc(100%-4rem)] flex-col items-start gap-1.5 sm:gap-2">
          {showSponsoredBadge && (
            <Badge className="border-0 bg-amber-pop text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-midnight-indigo shadow-md px-1.5 sm:px-2.5 py-0.5 sm:py-1">
              <Sparkles className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Tài trợ
            </Badge>
          )}
          <Badge className="max-w-full truncate border-0 bg-midnight-indigo/70 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md">
            {service.category?.name || 'Dịch vụ'}
          </Badge>
        </div>

        {(showFavorite || showCompare) && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 flex flex-col gap-1.5 sm:gap-2">
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
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-0 p-0 shadow-lg backdrop-blur-md transition-[background-color,color,transform] ${
                  isFavorite ? 'bg-red-500 text-white' : 'bg-white/85 text-foreground hover:bg-white'
                }`}
              >
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isFavorite ? 'fill-white' : ''}`} />
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
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-0 p-0 shadow-lg backdrop-blur-md transition-[background-color,color,transform] ${
                  isComparing ? 'bg-action-blue text-white' : 'bg-white/85 text-foreground hover:bg-white'
                }`}
              >
                <GitCompare className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        )}

        {service.distance && (
          <Badge className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 border-0 bg-midnight-indigo/70 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md">
            {service.distance.toFixed(1)} km
          </Badge>
        )}

        {showTrustBadges && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-midnight-indigo/65 px-1.5 py-0.5 sm:px-2 sm:py-1 text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Đang hoạt động</span>
            <span className="text-[8px] font-bold uppercase tracking-widest sm:hidden">Online</span>
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
              className="rounded-full border border-white/30 bg-white/20 px-6 font-bold text-white backdrop-blur-md transition-[background-color,color] duration-200 hover:bg-white hover:text-midnight-indigo"
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem nhanh
            </Button>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-3 sm:p-5 md:p-6">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-pop/15 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold text-midnight-indigo">
              <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-yellow-400 border-0" />
              {rating}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-normal text-muted-foreground">
              {totalReviews} đánh giá
            </div>
          </div>

          <Link href={detailHref} prefetch={false} onClick={handleDetailClick} className="block">
            <h3
              className="text-sm sm:text-lg font-bold text-midnight-indigo text-pretty transition-colors group-hover:text-action-blue leading-tight break-words [overflow-wrap:anywhere]"
              style={{ viewTransitionName: `service-title-${service.id}` } as any}
            >
              {service.name}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground text-pretty break-words [overflow-wrap:anywhere]">
            {service.description || 'Dịch vụ uy tín được cung cấp bởi đối tác chuyên nghiệp của HomeService.'}
          </p>
          {showTrustBadges && (
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <div className="flex items-center gap-1 rounded-full bg-pale-gray px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-glacier-blue">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Đã xác minh</span><span className="sm:hidden">Uy tín</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col gap-3 border-t border-border/50 pt-3 sm:pt-5">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="relative shrink-0 hidden sm:block">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-action-blue text-[10px] font-bold text-white shadow-md">
                {providerInitial}
              </div>
              <Shield className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-white text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nhà cung cấp
              </p>
              <span className="block text-[11px] sm:text-sm font-bold leading-snug text-foreground/85 break-words [overflow-wrap:anywhere]">
                {service.provider?.fullName || 'Đối tác HomeService'}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-platinum-tint bg-pale-gray/45 p-2.5 sm:p-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[8px] sm:text-[10px] font-bold uppercase leading-none tracking-widest text-muted-foreground">
              {priceMode === 'estimate' ? 'Khoảng' : 'Từ'}
              {showElite && showTrustBadges && (
                <span className="inline-flex items-center gap-1 rounded-full bg-action-blue px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-white tracking-normal">
                  <Diamond className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  Elite
                </span>
              )}
            </div>
            <div className={`${priceMode === 'estimate' ? 'text-[12px] sm:text-sm' : 'text-sm sm:text-lg'} max-w-full font-bold leading-tight text-action-blue tabular-nums break-words [overflow-wrap:anywhere]`}>
              {priceMode === 'estimate'
                ? fullEstimatePrice
                : formatPrice(service.referencePrice)}
            </div>
          </div>
        </div>
        {showPrimaryAction && (
          <Link 
            href={detailHref} 
            prefetch={false}
            onClick={handleDetailClick} 
            className="mt-3 sm:mt-5"
            aria-label={`Đặt ngay dịch vụ ${service.name}`}
          >
            <Button size="sm" className="w-full rounded-lg bg-action-blue font-bold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,box-shadow,transform] hover:bg-glacier-blue active:scale-[0.98] h-8 sm:h-10 text-xs sm:text-sm">
              Đặt ngay
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
