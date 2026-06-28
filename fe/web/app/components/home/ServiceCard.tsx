'use client';

import { Service } from '@/types';
import {
  UnifiedServiceCard,
  UnifiedServiceCardSkeleton,
} from '@/app/components/services/UnifiedServiceCard';

export function ServiceCardSkeleton() {
  return <UnifiedServiceCardSkeleton />;
}

export function ServiceCard({ service, priority = false }: { service: Service; priority?: boolean }) {
  return (
    <UnifiedServiceCard
      service={service}
      priority={priority}
      showFavorite
      showDescription={false}
      showTrustBadges
      showPrimaryAction
      useImageCarousel
      priceMode="estimate"
    />
  );
}
