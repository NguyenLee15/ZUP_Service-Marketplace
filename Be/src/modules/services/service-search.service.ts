import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { RedisService } from '../../shared/redis/redis.service';
import { calculateHaversineDistance } from '../../shared/utils/geo';
import { SearchServiceDto } from './dto/services.dto';
import {
  AiSearchRow,
  SearchServiceItem,
  SearchServicesResult,
} from './service-query.types';

@Injectable()
export class ServiceSearchService {
  private readonly logger = new Logger(ServiceSearchService.name);
  private readonly searchCache = new Map<
    string,
    { expiresAt: number; result: unknown }
  >();
  private readonly searchCacheTtlMs = 30_000;
  private readonly searchCacheMaxEntries = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly redisService: RedisService,
  ) {}

  async search(dto: SearchServiceDto): Promise<SearchServicesResult> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(Math.max(1, dto.limit || 20), 50);
    const isLocationSearch = this.hasLocationFilter(dto);
    const radiusKm = Math.min(Math.max(1, dto.radiusKm || 30), 50);
    const cacheKey = this.buildSearchCacheKey(dto, page, limit);
    const cached = this.getCachedSearchResult<SearchServicesResult>(cacheKey);

    if (cached) return cached;

    const where: Prisma.ServiceWhereInput = {
      status: ServiceStatus.ACTIVE,
      isDeleted: false,
      provider: {
        status: 'ACTIVE',
      },
    };

    if (dto.keyword) {
      const words = dto.keyword
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      if (words.length > 1) {
        where.AND = words.map(
          (word): Prisma.ServiceWhereInput => ({
            OR: [
              { name: { contains: word, mode: 'insensitive' } },
              { description: { contains: word, mode: 'insensitive' } },
            ],
          }),
        );
      } else {
        where.OR = [
          { name: { contains: dto.keyword, mode: 'insensitive' } },
          { description: { contains: dto.keyword, mode: 'insensitive' } },
        ];
      }
    }

    const requestedCategoryIds = this.getRequestedCategoryIds(dto);
    if (requestedCategoryIds.length > 0) {
      where.categoryId = {
        in: await this.getCategoryIdsWithDescendants(requestedCategoryIds),
      };
    }

    if (dto.minPrice || dto.maxPrice) {
      const referencePrice: Prisma.DecimalFilter = {};
      if (dto.minPrice) referencePrice.gte = dto.minPrice;
      if (dto.maxPrice) referencePrice.lte = dto.maxPrice;
      where.referencePrice = referencePrice;
    }
    if (dto.minRating) where.avgRating = { gte: dto.minRating };

    const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [
      { featuredListings: { _count: 'desc' } },
    ];
    if (dto.sortBy === 'rating') orderBy.push({ avgRating: 'desc' });
    else if (dto.sortBy === 'price_asc')
      orderBy.push({ referencePrice: 'asc' });
    else if (dto.sortBy === 'price_desc')
      orderBy.push({ referencePrice: 'desc' });
    else orderBy.push({ id: 'desc' });

    const data = await this.prisma.service.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        provider: { select: { id: true, fullName: true, avatarUrl: true } },
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        featuredListings: {
          where: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
          },
          take: 1,
        },
      },
      orderBy,
      ...(isLocationSearch
        ? {}
        : {
            skip: (page - 1) * limit,
            take: limit,
          }),
    });

    const totalBeforeLocationFilter = isLocationSearch
      ? data.length
      : await this.prisma.service.count({ where });

    let mappedData: SearchServiceItem[] = data.map((service) => ({
      ...service,
      isFeatured: service.featuredListings.length > 0,
    }));

    let locationExpanded = false;
    if (isLocationSearch) {
      const providerIds = [
        ...new Set(mappedData.map((service) => service.providerId)),
      ];
      const addressMap = await this.getProviderAddressMap(providerIds);

      mappedData = mappedData
        .map((service) => {
          const address = addressMap.get(service.providerId);
          if (!address) return service;

          const distanceKm = calculateHaversineDistance(
            dto.lat as number,
            dto.lng as number,
            Number(address.latitude),
            Number(address.longitude),
          );

          return {
            ...service,
            latitude: Number(address.latitude),
            longitude: Number(address.longitude),
            distance: distanceKm,
            distanceKm,
            providerAddress: `${address.addressDetail}, ${address.ward}, ${address.district}, ${address.province}`,
          };
        })
        .filter((service) => service.distanceKm !== undefined)
        .sort((a, b) => {
          const distanceDiff = (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
          if (distanceDiff !== 0) return distanceDiff;
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          return this.compareBySearchSort(a, b, dto.sortBy);
        });

      const nearbyData = mappedData.filter(
        (service) =>
          (service.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusKm,
      );

      mappedData = nearbyData;
    }

    const total = isLocationSearch
      ? mappedData.length
      : totalBeforeLocationFilter;
    const pagedData = isLocationSearch
      ? mappedData.slice((page - 1) * limit, page * limit)
      : mappedData;

    const result = {
      data: pagedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...(isLocationSearch ? { radiusKm, locationExpanded } : {}),
      },
    };

    this.setCachedSearchResult(cacheKey, result);
    return result;
  }

  async getAiState() {
    return this.aiService.getState();
  }

  async testAiSearch(query: string) {
    const state = await this.aiService.getState();
    const log: any = { query, state, embeddingError: null, pgError: null, success: false, results: [] };
    
    let embedding: number[] | null = null;
    try {
      embedding = await this.aiService.createEmbedding(query);
      if (!embedding) {
        log.embeddingError = "createEmbedding returned null";
      }
    } catch (e) {
      log.embeddingError = e instanceof Error ? e.message : String(e);
    }

    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      try {
        const services = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT s.*, 1 - (s.embedding <=> '${vectorStr}'::vector) as similarity
          FROM services s
          WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
          ORDER BY s.embedding <=> '${vectorStr}'::vector
          LIMIT 10
        `);
        log.success = true;
        log.results = services;
      } catch (e) {
        log.pgError = e instanceof Error ? e.message : String(e);
      }
    }
    return log;
  }

  async aiSearch(query: string) {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `ai_search:${normalizedQuery}`;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult) {
      this.logger.log(`[AI Caching] Cache hit for query: "${query}"`);
      return { data: this.parseAiSearchRows(cachedResult) };
    }

    this.logger.log(
      `[AI Caching] Cache miss for query: "${query}". Calling Gemini API...`,
    );

    const embedding = await this.aiService.createEmbedding(query);
    if (!embedding) {
      return this.search({ keyword: query, page: 1, limit: 10 });
    }

    const vectorStr = `[${embedding.join(',')}]`;

    try {
      const services = await this.prisma.$queryRawUnsafe<AiSearchRow[]>(`
        SELECT s.*, 1 - (s.embedding <=> '${vectorStr}'::vector) as similarity
        FROM services s
        WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
        ORDER BY s.embedding <=> '${vectorStr}'::vector
        LIMIT 10
      `);

      await this.redisService.set(cacheKey, JSON.stringify(services), 86400);
      return { data: services };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`pgvector search failed: ${message}`);
      return this.search({ keyword: query, page: 1, limit: 10 });
    }
  }

  private buildSearchCacheKey(
    dto: SearchServiceDto,
    page: number,
    limit: number,
  ) {
    const categoryIds = this.getRequestedCategoryIds(dto);

    return JSON.stringify({
      categoryId: dto.categoryId ?? null,
      categoryIds: categoryIds.length > 0 ? categoryIds.join(',') : null,
      keyword: dto.keyword?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '',
      limit,
      maxPrice: dto.maxPrice ?? null,
      minPrice: dto.minPrice ?? null,
      minRating: dto.minRating ?? null,
      page,
      province: dto.province?.trim().toLowerCase() ?? '',
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      radiusKm: dto.radiusKm ?? null,
      sortBy: dto.sortBy ?? 'newest',
    });
  }

  private parseCategoryIds(categoryIds?: string) {
    if (!categoryIds) return [];

    return categoryIds
      .split(',')
      .map((categoryId) => Number.parseInt(categoryId.trim(), 10))
      .filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0);
  }

  private getRequestedCategoryIds(dto: SearchServiceDto) {
    const categoryIds = new Set<number>(this.parseCategoryIds(dto.categoryIds));
    if (dto.categoryId) categoryIds.add(dto.categoryId);
    return [...categoryIds].sort((a, b) => a - b);
  }

  private async getCategoryIdsWithDescendants(categoryIds: number[]) {
    return Array.from(new Set(categoryIds));
  }

  private getCachedSearchResult<T>(cacheKey: string): T | null {
    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    return cached.result as T;
  }

  private setCachedSearchResult(cacheKey: string, result: unknown) {
    const now = Date.now();
    if (this.searchCache.size >= this.searchCacheMaxEntries) {
      for (const [key, value] of this.searchCache) {
        if (
          value.expiresAt <= now ||
          this.searchCache.size > this.searchCacheMaxEntries / 2
        ) {
          this.searchCache.delete(key);
        }
      }
    }

    this.searchCache.set(cacheKey, {
      expiresAt: now + this.searchCacheTtlMs,
      result,
    });
  }

  private hasLocationFilter(dto: SearchServiceDto) {
    return Number.isFinite(dto.lat) && Number.isFinite(dto.lng);
  }

  private getProviderAddressMap(providerIds: number[]) {
    return this.prisma.userAddress
      .findMany({
        where: {
          userId: { in: providerIds },
          isDefault: true,
        },
        select: {
          userId: true,
          province: true,
          district: true,
          ward: true,
          addressDetail: true,
          latitude: true,
          longitude: true,
        },
      })
      .then((addresses) => {
        const addressMap = new Map<number, (typeof addresses)[number]>();
        for (const address of addresses)
          addressMap.set(address.userId, address);
        return addressMap;
      });
  }

  private compareBySearchSort(
    a: SearchServiceItem,
    b: SearchServiceItem,
    sortBy?: string,
  ) {
    if (sortBy === 'rating') return Number(b.avgRating) - Number(a.avgRating);
    if (sortBy === 'price_asc') {
      return Number(a.referencePrice) - Number(b.referencePrice);
    }
    if (sortBy === 'price_desc') {
      return Number(b.referencePrice) - Number(a.referencePrice);
    }
    return Number(b.id) - Number(a.id);
  }

  private parseAiSearchRows(raw: string): AiSearchRow[] {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is AiSearchRow => {
        if (!item || typeof item !== 'object') return false;
        const row = item as Record<string, unknown>;
        return (
          typeof row.id === 'number' &&
          typeof row.name === 'string' &&
          typeof row.description === 'string' &&
          typeof row.similarity === 'number'
        );
      });
    } catch {
      return [];
    }
  }
}
