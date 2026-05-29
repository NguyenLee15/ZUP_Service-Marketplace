'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';
import { useServiceStore } from '@/store/service.store';

export function RecentlyViewedServices() {
  const { recentlyViewed, favorites, toggleFavoriteService } = useServiceStore();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 id="goi-y-cho-ban" className="text-2xl md:text-[38px] font-bold brand-heading leading-tight text-balance">
              Gợi ý dành riêng cho bạn
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Dựa trên các dịch vụ bạn đã quan tâm gần đây
          </p>
        </div>
        <Link
          href="/services"
          prefetch={false}
          className="inline-flex text-sm font-bold text-action-blue hover:text-glacier-blue items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue rounded-md"
        >
          Xem tất cả thợ
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {recentlyViewed.slice(0, 4).map((service) => (
          <UnifiedServiceCard
            key={service.id}
            service={service}
            isFavorite={favorites.includes(service.id)}
            showFavorite
            showDescription={false}
            showTrustBadges
            showPrimaryAction
            useImageCarousel
            priceMode="estimate"
            onToggleFavorite={toggleFavoriteService}
          />
        ))}
      </div>
    </section>
  );
}
