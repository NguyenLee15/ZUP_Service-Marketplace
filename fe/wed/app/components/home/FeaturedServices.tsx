'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';
import { useServiceStore } from '@/store/service.store';
import { Service } from '@/types';

interface FeaturedServicesProps {
  services: Service[];
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  isSponsored?: boolean;
}

export function FeaturedServices({
  services,
  title = 'Dịch vụ tuyển chọn',
  description = 'Những dịch vụ được đánh giá cao nhất từ cộng đồng người dùng',
  href = '/services',
  actionLabel = 'Khám phá tất cả',
  isSponsored,
}: FeaturedServicesProps) {
  const { favorites, toggleFavoriteService } = useServiceStore();

  if (services.length === 0) return null;

  return (
    <section>
      {!isSponsored && (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-5">
          <div>
            <h2 className="text-2xl md:text-[38px] font-bold brand-heading mb-3 leading-tight text-balance">{title}</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{description}</p>
          </div>
          <Link href={href} prefetch={false} className="text-glacier-blue hover:text-glacier-blue font-bold inline-flex items-center justify-center gap-2 bg-pale-gray px-5 py-3 rounded-xl hover:bg-platinum-tint/60 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
            {actionLabel}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {services.map((service, index) => (
          <UnifiedServiceCard
            key={service.id || index}
            service={service}
            isFavorite={favorites.includes(service.id)}
            showFavorite
            showDescription={false}
            showSponsoredBadge={isSponsored}
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
