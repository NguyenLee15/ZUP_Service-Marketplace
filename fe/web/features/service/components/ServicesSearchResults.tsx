'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';
import type { Service } from '@/types';
import type { SearchMeta, UserLocationState } from '../hooks/useServicesSearchFlow';

const ServiceMap = dynamic(
  () => import('@/app/components/services/ServiceMap').then((mod) => mod.ServiceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] surface-card rounded-[20px] flex items-center justify-center font-bold text-muted-foreground uppercase tracking-widest">
        Đang tải bản đồ…
      </div>
    ),
  },
);

interface ServicesSearchResultsProps {
  viewMode: 'grid' | 'map';
  services: Service[];
  userLocation: UserLocationState;
  loading: boolean;
  isFetchingMore: boolean;
  meta: SearchMeta;
  favorites: number[];
  toggleFavoriteService: (service: Service) => void;
  addRecentlyViewed: (service: Service) => void;
  onClearFilters: () => void;
  observerTarget: React.RefObject<HTMLDivElement | null>;
}

export function ServicesSearchResults({
  viewMode,
  services,
  userLocation,
  loading,
  isFetchingMore,
  meta,
  favorites,
  toggleFavoriteService,
  addRecentlyViewed,
  onClearFilters,
  observerTarget,
}: ServicesSearchResultsProps) {
  if (viewMode === 'map') {
    return (
      <ServiceMap
        services={services}
        userLocation={userLocation.source === 'gps' ? userLocation : null}
      />
    );
  }

  if (loading && !isFetchingMore) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[260px] sm:h-[300px] surface-card rounded-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center justify-center py-20 sm:py-32 text-center rounded-[20px] border-dashed transition-colors animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-pale-gray rounded-full flex items-center justify-center mb-8 relative">
          <Search className="w-10 h-10 text-muted-foreground/30" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-action-blue rounded-full flex items-center justify-center border-4 border-background">
            <X className="w-3 h-3 text-white" />
          </div>
        </div>
        <h3 className="max-w-sm px-4 text-xl sm:text-2xl font-bold brand-heading mb-3 text-balance">
          Không tìm thấy kết quả nào
        </h3>
        <p className="text-muted-foreground max-w-sm px-4 text-pretty leading-relaxed">
          Chúng tôi không tìm thấy dịch vụ nào khớp với tiêu chí bạn chọn. Thử mở rộng bộ lọc hoặc
          tìm kiếm lại nhé!
        </p>
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="mt-8 px-8 py-6 rounded-xl border-platinum-tint hover:bg-pale-gray hover:text-action-blue transition-colors font-bold"
        >
          Xóa tất cả bộ lọc
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {services.map((service, index) => {
          const isFavorite = favorites.includes(service.id);

          return (
            <div
              key={`${service.id}-${index}`}
              className="group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            >
              <UnifiedServiceCard
                service={service}
                priority={index < 3}
                isFavorite={isFavorite}
                showFavorite
                showDescription={false}
                showTrustBadges
                showPrimaryAction
                useImageCarousel
                priceMode="estimate"
                onToggleFavorite={toggleFavoriteService}
                onRecentlyViewed={addRecentlyViewed}
              />
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-10">
        {isFetchingMore && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
            <div className="w-6 h-6 border-2 border-action-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
              Đang tải thêm…
            </span>
          </div>
        )}
        {!isFetchingMore && meta.page >= meta.totalPages && services.length > 0 && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-0.5 bg-border rounded-full" />
            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
              Bạn đã xem hết dịch vụ
            </span>
          </div>
        )}
      </div>
    </>
  );
}
