'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Heart, Search, RefreshCw } from 'lucide-react';
import { serviceApi } from '@/features/service/services/service.api';
import { Button } from '@/components/ui/button';
import { Service } from '@/types';
import { useServiceStore } from '@/store/service.store';
import { UnifiedServiceCard, UnifiedServiceCardSkeleton } from '@/app/components/services/UnifiedServiceCard';
import { CustomerPageHeader } from '@/components/customer/CustomerPageHeader';

export default function FavoritesPage() {
  const {
    favorites,
    favoriteServices,
    toggleFavoriteService,
    addRecentlyViewed,
  } = useServiceStore();
  const [fetchedServices, setFetchedServices] = useState<Service[]>([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const storedFavoriteServices = useMemo(() => {
    const favoriteSet = new Set(favorites);
    const byId = new Map<number, Service>();

    [...favoriteServices, ...fetchedServices].forEach((service) => {
      if (favoriteSet.has(service.id)) byId.set(service.id, service);
    });

    return favorites
      .map((id) => byId.get(id))
      .filter((service): service is Service => Boolean(service));
  }, [favoriteServices, favorites, fetchedServices]);

  useEffect(() => {
    const knownIds = new Set([
      ...favoriteServices.map((service) => service.id),
      ...fetchedServices.map((service) => service.id),
    ]);
    const missingIds = favorites.filter((id) => !knownIds.has(id));

    if (missingIds.length === 0) {
      setLoadError('');
      return;
    }

    let cancelled = false;
    setLoadingMissing(true);
    setLoadError('');

    Promise.allSettled(
      missingIds.map((id) => serviceApi.getById(id)),
    ).then((results) => {
      if (cancelled) return;

      const loadedServices = results
        .filter((result): result is PromiseFulfilledResult<ApiPayload> => result.status === 'fulfilled')
        .map((result) => result.value.data.data || result.value.data)
        .filter((service): service is Service => Boolean(service?.id));

      if (loadedServices.length > 0) {
        setFetchedServices((prev) => {
          const byId = new Map(prev.map((service) => [service.id, service]));
          loadedServices.forEach((service) => byId.set(service.id, service));
          return Array.from(byId.values());
        });
      }

      if (loadedServices.length < missingIds.length) {
        setLoadError('Một số dịch vụ yêu thích chưa tải được. Vui lòng kiểm tra backend hoặc thử lại sau.');
      }
    }).finally(() => {
      if (!cancelled) setLoadingMissing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [favoriteServices, favorites, fetchedServices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CustomerPageHeader
          eyebrow="Bộ sưu tập cá nhân"
          title="Dịch vụ yêu thích"
          description="Lưu lại các dịch vụ bạn quan tâm để so sánh, xem lại và đặt lịch nhanh hơn."
        />
        <Link href="/services">
          <Button className="rounded-xl bg-sky-600 px-6 font-semibold text-white transition-colors hover:bg-sky-500 shadow-xs">
            <Search className="mr-2 h-4 w-4" />
            Tìm thêm dịch vụ
          </Button>
        </Link>
      </div>

      {loadError && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/60 px-5 py-4 text-amber-900 dark:text-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold text-sm">Chưa tải đủ dữ liệu dịch vụ</p>
              <p className="text-xs text-amber-800 dark:text-amber-300">{loadError}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/50"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Thử lại
          </Button>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Bạn chưa có dịch vụ yêu thích</h2>
          <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Khi thấy dịch vụ phù hợp, bấm biểu tượng trái tim trên thẻ dịch vụ để lưu lại tại đây.
          </p>
          <Link href="/services">
            <Button className="rounded-xl bg-sky-600 px-7 font-semibold text-white transition-colors hover:bg-sky-500 shadow-xs">
              Khám phá dịch vụ
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              {favorites.length} dịch vụ đã lưu
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {storedFavoriteServices.map((service, index) => (
              <UnifiedServiceCard
                key={service.id}
                service={service}
                priority={index < 3}
                isFavorite
                showFavorite
                showDescription={false}
                showTrustBadges
                showPrimaryAction
                useImageCarousel
                priceMode="estimate"
                onToggleFavorite={toggleFavoriteService}
                onRecentlyViewed={addRecentlyViewed}
              />
            ))}
            {loadingMissing && [...Array(Math.max(1, favorites.length - storedFavoriteServices.length))].map((_, index) => (
              <UnifiedServiceCardSkeleton key={`missing-${index}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
