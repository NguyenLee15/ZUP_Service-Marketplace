'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';
import { useServiceStore } from '@/store/service.store';
import { serviceApi } from '@/features/service/services/service.api';
import { Service } from '@/types';

export function RecentlyViewedServices() {
  const { recentlyViewed, favorites, toggleFavoriteService, removeRecentlyViewed } = useServiceStore();
  const [validServices, setValidServices] = useState<Service[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Chỉ kiểm tra 4 dịch vụ đầu tiên
    const topServices = recentlyViewed.slice(0, 4);
    
    if (topServices.length === 0) {
      setIsChecking(false);
      if (isMounted) setValidServices([]);
      return;
    }

    const checkServices = async () => {
      setIsChecking(true);
      const valid: Service[] = [];
      const invalidIds: number[] = [];

      await Promise.allSettled(
        topServices.map(async (service) => {
          try {
            const response = await serviceApi.getById(service.id);
            // Kiểm tra dịch vụ còn tồn tại và đang active
            if (response.data && response.data.status === 'ACTIVE' && !response.data.isDeleted) {
              valid.push(response.data);
            } else {
              invalidIds.push(service.id);
            }
          } catch (error) {
            invalidIds.push(service.id);
          }
        })
      );

      // Xoá các dịch vụ lỗi/đã xoá khỏi store
      invalidIds.forEach((id) => {
        removeRecentlyViewed(id);
      });

      if (isMounted) {
        // Giữ nguyên thứ tự ban đầu
        const sortedValid = topServices
          .map(ts => valid.find(vs => vs.id === ts.id))
          .filter((s): s is Service => !!s);
          
        setValidServices(sortedValid);
        setIsChecking(false);
      }
    };

    checkServices();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isChecking) return null;
  if (validServices.length === 0) return null;

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
          Xem thêm
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {validServices.map((service) => (
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
