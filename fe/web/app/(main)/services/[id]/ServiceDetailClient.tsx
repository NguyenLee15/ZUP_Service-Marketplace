'use client';

import React from 'react';
import { Star, Scale, Diamond } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/navigation/BackButton';
import { useServiceDetailFlow } from '@/features/service/hooks/useServiceDetailFlow';
import { ServiceImageGallery } from '@/features/service/components/detail/ServiceImageGallery';
import { ServicePricingEstimateCard } from '@/features/service/components/detail/ServicePricingEstimateCard';
import { ServiceItemsTable } from '@/features/service/components/detail/ServiceItemsTable';
import { ServiceProviderInfoCard } from '@/features/service/components/detail/ServiceProviderInfoCard';
import { ServiceProviderStatsCard } from '@/features/service/components/detail/ServiceProviderStatsCard';
import { ServiceReviewsList } from '@/features/service/components/detail/ServiceReviewsList';
import { ServiceStickyFooter } from '@/features/service/components/detail/ServiceStickyFooter';

export function ServiceDetailClient({ service }: { service: ApiPayload }) {
  const {
    currentImage,
    setCurrentImage,
    chatLoading,
    providerStats,
    images,
    reviews,
    referencePrice,
    estimateLow,
    estimateHigh,
    formatPrice,
    handleStartChat,
    handleBookNow,
    isAuthenticated,
  } = useServiceDetailFlow(service);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-44 animate-in fade-in duration-500 sm:pb-40">
      {/* Back Button */}
      <BackButton fallbackHref="/services" className="mb-6" />

      {/* Image Gallery */}
      <ServiceImageGallery
        images={images}
        currentImage={currentImage}
        onSelectImage={setCurrentImage}
        serviceName={service.name}
      />

      {/* Service Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {service.category?.name}
              </Badge>
              {Number(service.avgRating || 0) >= 4.8 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-action-blue text-white text-[10px] font-bold uppercase tracking-widest shadow-[var(--brand-shadow-sm)]">
                  <Diamond className="w-3 h-3" />
                  Elite Partner
                </div>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {service.name}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
              Giá từ
              <Scale className="w-3 h-3 text-emerald-500" />
            </p>
            <div className="flex flex-col items-end mt-1">
              <p className="text-xl sm:text-2xl font-bold text-action-blue">
                {formatPrice(referencePrice)}
              </p>
              <div className="flex items-center gap-1 mt-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-widest hidden sm:inline">
                  Giá đề xuất
                </span>
                <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest sm:hidden">
                  Đề xuất
                </span>
                <div className="w-1.5 h-1.5 sm:w-1 sm:h-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold dark:text-white">
              {Number(service.avgRating || 0).toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({service.totalReviews} đánh giá)
            </span>
          </div>
        </div>

        {/* Pricing Estimate */}
        <ServicePricingEstimateCard
          estimateLow={estimateLow}
          estimateHigh={estimateHigh}
          formatPrice={formatPrice}
        />

        <Separator />

        <div>
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            Mô tả dịch vụ
          </h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {service.description}
          </p>
        </div>

        <Separator />

        {/* Detailed Items Table */}
        <ServiceItemsTable
          items={service.items}
          formatPrice={formatPrice}
        />

        {/* Provider Card */}
        <ServiceProviderInfoCard
          provider={service.provider}
          isAuthenticated={isAuthenticated()}
          chatLoading={chatLoading}
          onStartChat={handleStartChat}
        />

        <Separator />

        {/* Provider Performance Metrics */}
        <ServiceProviderStatsCard
          providerStats={providerStats}
          avgRating={service.avgRating}
        />

        <Separator />

        {/* Customer Reviews */}
        <ServiceReviewsList reviews={reviews} />
      </div>

      {/* Sticky Booking CTA Footer */}
      <ServiceStickyFooter
        referencePrice={referencePrice}
        formatPrice={formatPrice}
        onBookNow={handleBookNow}
      />
    </div>
  );
}
