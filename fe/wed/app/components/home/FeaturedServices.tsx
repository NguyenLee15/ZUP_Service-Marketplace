'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { UnifiedServiceCard, UnifiedServiceCardSkeleton } from '@/app/components/services/UnifiedServiceCard';
import { useServiceStore } from '@/store/service.store';
import { Service } from '@/types';

interface FeaturedServicesProps {
  services: Service[];
  isSponsored?: boolean;
}

export function FeaturedServices({ services, isSponsored }: FeaturedServicesProps) {
  const { favorites, toggleFavoriteService } = useServiceStore();
  const [visibleServices, setVisibleServices] = useState(services);

  useEffect(() => {
    setVisibleServices(services);
  }, [services]);

  useEffect(() => {
    if (services.length > 0) return;

    let cancelled = false;

    async function loadFallbackServices() {
      try {
        const { serviceApi } = await import('@/features/service/services/service.api');
        const response = isSponsored
          ? await serviceApi.getFeatured()
          : await serviceApi.search({ limit: 8, sortBy: 'rating' });

        if (!cancelled) {
          setVisibleServices(response.data.data || []);
        }
      } catch {}
    }

    void loadFallbackServices();

    return () => {
      cancelled = true;
    };
  }, [isSponsored, services.length]);

  return (
    <section>
      {!isSponsored && (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-5">
          <div>
            <h2 className="text-2xl md:text-[38px] font-bold brand-heading mb-3 leading-tight text-balance">Dịch vụ tuyển chọn</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">Những dịch vụ được đánh giá cao nhất từ cộng đồng người dùng</p>
          </div>
          <Link href="/services" className="text-glacier-blue hover:text-glacier-blue font-bold inline-flex items-center justify-center gap-2 bg-pale-gray px-5 py-3 rounded-xl hover:bg-platinum-tint/60 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
            Khám phá tất cả
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {visibleServices.length > 0 ? (
          visibleServices.map((service, index) => (
            <UnifiedServiceCard
              key={service.id || index}
              service={service}
              priority={index < 4}
              isFavorite={favorites.includes(service.id)}
              showFavorite
              showSponsoredBadge={isSponsored}
              showTrustBadges
              showPrimaryAction
              useImageCarousel
              priceMode="estimate"
              onToggleFavorite={toggleFavoriteService}
            />
          ))
        ) : (
          [1, 2, 3, 4].map((i) => (
            <UnifiedServiceCardSkeleton key={i} />
          ))
        )}
      </div>
    </section>
  );
}
