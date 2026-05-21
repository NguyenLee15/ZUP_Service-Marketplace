'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Heart, Search } from 'lucide-react';
import { serviceApi } from '@/features/service/services/service.api';
import { Button } from '@/components/ui/button';
import { Service } from '@/types';
import { useServiceStore } from '@/store/service.store';
import { UnifiedServiceCard, UnifiedServiceCardSkeleton } from '@/app/components/services/UnifiedServiceCard';

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
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
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
    <div className="space-y-8">
      <div className="surface-card flex flex-col gap-4 rounded-[20px] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Bộ sưu tập của bạn</p>
          </div>
          <h1 className="text-3xl font-bold brand-heading">Dịch vụ yêu thích</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Lưu lại các dịch vụ bạn quan tâm để so sánh, xem lại và đặt lịch nhanh hơn.
          </p>
        </div>
        <Link href="/services">
          <Button className="rounded-xl bg-action-blue px-6 font-bold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue">
            <Search className="mr-2 h-4 w-4" />
            Tìm thêm dịch vụ
          </Button>
        </Link>
      </div>

      {loadError && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Chưa tải đủ dữ liệu</p>
            <p className="text-sm text-amber-800">{loadError}</p>
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[20px] border-dashed px-6 py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Heart className="h-9 w-9" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">Bạn chưa có dịch vụ yêu thích</h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            Khi thấy dịch vụ phù hợp, bấm biểu tượng trái tim trên card để lưu lại tại đây.
          </p>
          <Link href="/services">
            <Button className="rounded-xl bg-action-blue px-8 font-bold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue">
              Khám phá dịch vụ
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">
              {favorites.length} dịch vụ đã lưu
            </p>
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
