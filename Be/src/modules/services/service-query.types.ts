import { Prisma } from '@prisma/client';

export type SearchServicesResult = {
  data: SearchServiceItem[];
  meta: {
    limit: number;
    locationExpanded?: boolean;
    page: number;
    radiusKm?: number;
    total: number;
    totalPages: number;
  };
};

export type ServiceSearchBase = Prisma.ServiceGetPayload<{
  include: {
    category: {
      select: { id: true; name: true; parentId: true; level: true };
    };
    provider: { select: { id: true; fullName: true; avatarUrl: true } };
    images: true;
    featuredListings: true;
  };
}>;

export type SearchServiceItem = ServiceSearchBase & {
  isFeatured: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number;
  distanceKm?: number;
  providerAddress?: string;
};

export interface PublicProviderServicesQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface AiSearchRow {
  id: number;
  name: string;
  description: string;
  similarity: number;
}
