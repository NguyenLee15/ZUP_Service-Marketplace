import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
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
import {
  buildServiceSearchCacheKey,
  getCategoryIdsWithDescendants,
  getRequestedCategoryIds,
} from './service-search-params';

type AiSearchDiagnostics = {
  query: string;
  state: ReturnType<AiService['getState']>;
  embeddingError: string | null;
  pgError: string | null;
  success: boolean;
  results: unknown[];
};

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
    const cacheKey = buildServiceSearchCacheKey(dto, page, limit);
    const cached =
      await this.getCachedSearchResult<SearchServicesResult>(cacheKey);

    if (cached) return cached;

    const where: Prisma.ServiceWhereInput = {
      status: ServiceStatus.ACTIVE,
      isDeleted: false,
      provider: {
        status: 'ACTIVE',
        isOnline: true,
        providerWallet: { isRestricted: false },
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

    const requestedCategoryIds = getRequestedCategoryIds(dto);
    if (requestedCategoryIds.length > 0) {
      where.categoryId = {
        in: getCategoryIdsWithDescendants(requestedCategoryIds),
      };
    }

    if (dto.minPrice || dto.maxPrice) {
      const referencePrice: Prisma.DecimalFilter = {};
      if (dto.minPrice) referencePrice.gte = dto.minPrice;
      if (dto.maxPrice) referencePrice.lte = dto.maxPrice;
      where.referencePrice = referencePrice;
    }
    if (dto.minRating) where.avgRating = { gte: dto.minRating };

    if (isLocationSearch) {
      const result = await this.searchByLocation(dto, page, limit, radiusKm);
      await this.setCachedSearchResult(cacheKey, result);
      return result;
    }

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
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalBeforeLocationFilter = await this.prisma.service.count({
      where,
    });

    const mappedData: SearchServiceItem[] = data.map((service) => ({
      ...service,
      isFeatured: service.featuredListings.length > 0,
    }));

    const total = totalBeforeLocationFilter;
    const pagedData = mappedData;

    const result = {
      data: pagedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.setCachedSearchResult(cacheKey, result);
    return result;
  }

  getAiState() {
    return this.aiService.getState();
  }

  async testAiSearch(query: string) {
    const state = this.aiService.getState();
    const log: AiSearchDiagnostics = {
      query,
      state,
      embeddingError: null,
      pgError: null,
      success: false,
      results: [],
    };

    let embedding: number[] | null = null;
    try {
      embedding = await this.aiService.createEmbedding(query);
      if (!embedding) {
        log.embeddingError = 'createEmbedding returned null';
      }
    } catch (e) {
      log.embeddingError = e instanceof Error ? e.message : String(e);
    }

    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      try {
        const rawResults = await this.prisma.$queryRaw<
          { id: number; similarity: number }[]
        >(Prisma.sql`
          SELECT s.id, 1 - (s.embedding <=> ${vectorStr}::vector) as similarity
          FROM services s
          INNER JOIN users u ON s.provider_id = u.id
          LEFT JOIN provider_wallets pw ON pw.provider_id = u.id
          WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
            AND u.status = 'ACTIVE' AND u.is_online = true
            AND (pw.is_restricted IS NULL OR pw.is_restricted = false)
            AND 1 - (s.embedding <=> ${vectorStr}::vector) > 0.50
          ORDER BY s.embedding <=> ${vectorStr}::vector
          LIMIT 20
        `);

        if (rawResults.length > 0) {
          const serviceIds = rawResults.map((r) => r.id);
          const similarityMap = new Map(
            rawResults.map((r) => [r.id, r.similarity]),
          );

          const fullServices = await this.prisma.service.findMany({
            where: { id: { in: serviceIds } },
            include: {
              category: { select: { id: true, name: true } },
              provider: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
              images: { orderBy: { displayOrder: 'asc' }, take: 1 },
              featuredListings: {
                where: { status: 'ACTIVE', endDate: { gt: new Date() } },
                take: 1,
              },
            },
          });

          // Gắn isFeatured và similarity, sắp xếp lại theo similarity
          const mappedData = fullServices
            .map((service) => ({
              ...service,
              isFeatured: service.featuredListings.length > 0,
              similarity: similarityMap.get(service.id) || 0,
            }))
            .sort((a, b) => b.similarity - a.similarity);

          log.success = true;
          log.results = mappedData;
        } else {
          log.success = true;
          log.results = [];
        }
      } catch (e) {
        log.pgError = e instanceof Error ? e.message : String(e);
      }
    }
    return log;
  }

  async aiSearch(query: string, lat?: number, lng?: number) {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `ai_search:${normalizedQuery}`;
    const cachedResult = await this.redisService.get(cacheKey);

    let baseData: SearchServiceItem[] = [];

    if (cachedResult) {
      this.logger.log(`[AI Caching] Cache hit for query: "${query}"`);
      baseData = this.parseAiSearchRows(
        cachedResult,
      ) as unknown as SearchServiceItem[];
    } else {
      this.logger.log(
        `[AI Caching] Cache miss for query: "${query}". Calling Gemini API...`,
      );

      const embedding = await this.aiService.createEmbedding(query);
      if (!embedding) {
        return this.search({ keyword: query, page: 1, limit: 10, lat, lng });
      }

      const vectorStr = `[${embedding.join(',')}]`;

      try {
        const rawResults = await this.prisma.$queryRaw<
          { id: number; similarity: number }[]
        >(Prisma.sql`
          SELECT s.id, 1 - (s.embedding <=> ${vectorStr}::vector) as similarity
          FROM services s
          INNER JOIN users u ON s.provider_id = u.id
          INNER JOIN provider_wallets pw ON pw.provider_id = u.id
          WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
            AND u.status = 'ACTIVE' AND u.is_online = true
            AND pw.is_restricted = false
            AND 1 - (s.embedding <=> ${vectorStr}::vector) > 0.50
          ORDER BY s.embedding <=> ${vectorStr}::vector
          LIMIT 20
        `);

        if (rawResults.length === 0) {
          this.logger.log(
            `[AI Caching] No AI results > 0.50, falling back to keyword search for: "${query}"`,
          );
          return this.search({ keyword: query, page: 1, limit: 10, lat, lng });
        }

        const maxSimilarity = rawResults[0].similarity;
        const filteredResults = rawResults.filter(
          (r) => r.similarity >= 0.55 && r.similarity >= maxSimilarity - 0.05,
        );

        if (filteredResults.length === 0) {
          this.logger.log(
            `[AI Caching] No filtered AI results, falling back to keyword search for: "${query}"`,
          );
          return this.search({ keyword: query, page: 1, limit: 10, lat, lng });
        }

        const serviceIds = filteredResults.map((r) => r.id);
        const similarityMap = new Map(
          filteredResults.map((r) => [r.id, r.similarity]),
        );

        const fullServices = await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          include: {
            category: { select: { id: true, name: true } },
            provider: { select: { id: true, fullName: true, avatarUrl: true } },
            images: { orderBy: { displayOrder: 'asc' }, take: 1 },
            featuredListings: {
              where: { status: 'ACTIVE', endDate: { gt: new Date() } },
              take: 1,
            },
          },
        });

        baseData = fullServices
          .map((service) => ({
            ...service,
            isFeatured: service.featuredListings.length > 0,
            similarity: similarityMap.get(service.id) || 0,
          }))
          .sort((a, b) => b.similarity - a.similarity);

        await this.redisService.set(cacheKey, JSON.stringify(baseData), 86400);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`pgvector search failed: ${message}`);
        return this.search({ keyword: query, page: 1, limit: 10, lat, lng });
      }
    }

    let resultData = [...baseData];
    if (lat && lng) {
      const providerIds = [...new Set(resultData.map((s) => s.providerId))];
      const addressMap = await this.getProviderAddressMap(providerIds);

      resultData = resultData.map((service) => {
        const address = addressMap.get(service.providerId);
        if (!address) return service;

        const distanceKm = calculateHaversineDistance(
          lat,
          lng,
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
      });
    }

    return { data: resultData };
  }

  @OnEvent('cache.clear.services')
  async clearCache() {
    this.logger.log('Clearing service search caches...');
    this.searchCache.clear();
    await this.redisService.delByPattern('service_search:*');
    await this.redisService.delByPattern('ai_search:*');
  }

  private async getCachedSearchResult<T>(cacheKey: string): Promise<T | null> {
    if (this.redisService.isEnabled()) {
      try {
        const cached = await this.redisService.getJson<T>(
          `service_search:${cacheKey}`,
        );
        if (cached) return cached;
      } catch (error) {
        this.logger.warn(
          `Service search Redis read failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    return cached.result as T;
  }

  private async setCachedSearchResult(cacheKey: string, result: unknown) {
    if (this.redisService.isEnabled()) {
      try {
        await this.redisService.setJson(
          `service_search:${cacheKey}`,
          result as object,
          this.searchCacheTtlMs / 1000,
        );
        return;
      } catch (error) {
        this.logger.warn(
          `Service search Redis write failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

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

  private async searchByLocation(
    dto: SearchServiceDto,
    page: number,
    limit: number,
    radiusKm: number,
  ): Promise<SearchServicesResult> {
    const lat = dto.lat as number;
    const lng = dto.lng as number;
    const deltaLat = radiusKm / 111;
    const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s.status = 'ACTIVE'`,
      Prisma.sql`s.is_deleted = false`,
      Prisma.sql`u.status = 'ACTIVE'`,
      Prisma.sql`u.is_online = true`,
      Prisma.sql`pw.is_restricted = false`,
      Prisma.sql`a.is_default = true`,
      Prisma.sql`a.latitude BETWEEN ${lat - deltaLat} AND ${lat + deltaLat}`,
      Prisma.sql`a.longitude BETWEEN ${lng - deltaLng} AND ${lng + deltaLng}`,
    ];

    const words = dto.keyword?.trim().split(/\s+/).filter(Boolean) ?? [];
    for (const word of words) {
      const pattern = `%${word}%`;
      conditions.push(
        Prisma.sql`(s.name ILIKE ${pattern} OR s.description ILIKE ${pattern})`,
      );
    }
    const categoryIds = getRequestedCategoryIds(dto);
    if (categoryIds.length > 0) {
      conditions.push(
        Prisma.sql`s.category_id IN (${Prisma.join(categoryIds)})`,
      );
    }
    if (dto.minPrice !== undefined) {
      conditions.push(Prisma.sql`s.reference_price >= ${dto.minPrice}`);
    }
    if (dto.maxPrice !== undefined) {
      conditions.push(Prisma.sql`s.reference_price <= ${dto.maxPrice}`);
    }
    if (dto.minRating !== undefined) {
      conditions.push(Prisma.sql`s.avg_rating >= ${dto.minRating}`);
    }
    if (dto.province?.trim()) {
      conditions.push(Prisma.sql`a.province = ${dto.province.trim()}`);
    }

    const sortSql =
      dto.sortBy === 'rating'
        ? Prisma.sql`s.avg_rating DESC`
        : dto.sortBy === 'price_asc'
          ? Prisma.sql`s.reference_price ASC`
          : dto.sortBy === 'price_desc'
            ? Prisma.sql`s.reference_price DESC`
            : Prisma.sql`s.id DESC`;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        distanceKm: number;
        totalCount: number;
        providerAddress: string;
      }>
    >(Prisma.sql`
      SELECT id, distance_km AS "distanceKm", provider_address AS "providerAddress",
        COUNT(*) OVER()::int AS "totalCount"
      FROM (
        SELECT
          s.id,
          s.avg_rating,
          s.reference_price,
          CASE WHEN EXISTS (
            SELECT 1 FROM featured_listings fl
            WHERE fl.service_id = s.id
              AND fl.status = 'ACTIVE'
              AND fl.end_date > NOW()
          ) THEN true ELSE false END AS is_featured,
          CONCAT(a.address_detail, ', ', a.ward, ', ', a.district, ', ', a.province) AS provider_address,
          6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(CAST(a.latitude AS double precision) - ${lat}) / 2), 2) +
            COS(RADIANS(${lat})) * COS(RADIANS(CAST(a.latitude AS double precision))) *
            POWER(SIN(RADIANS(CAST(a.longitude AS double precision) - ${lng}) / 2), 2)
          )) AS distance_km
        FROM services s
        INNER JOIN users u ON u.id = s.provider_id
        INNER JOIN provider_wallets pw ON pw.provider_id = u.id
        INNER JOIN user_addresses a ON a.user_id = u.id
        WHERE ${Prisma.join(conditions, ' AND ')}
      ) candidates
      WHERE distance_km <= ${radiusKm}
      ORDER BY distance_km ASC, is_featured DESC, ${sortSql}
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `);

    const serviceIds = rows.map((row) => row.id);
    if (serviceIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          radiusKm,
          locationExpanded: false,
        },
      };
    }

    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, fullName: true, avatarUrl: true } },
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        featuredListings: {
          where: { status: 'ACTIVE', endDate: { gt: new Date() } },
          take: 1,
        },
      },
    });
    const serviceMap = new Map(
      services.map((service) => [service.id, service]),
    );
    const data = rows.flatMap((row) => {
      const service = serviceMap.get(row.id);
      if (!service) return [];
      return [
        {
          ...service,
          isFeatured: service.featuredListings.length > 0,
          distance: Number(row.distanceKm),
          distanceKm: Number(row.distanceKm),
          providerAddress: row.providerAddress,
        },
      ];
    }) as SearchServiceItem[];
    const total = rows[0]?.totalCount ?? 0;
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        radiusKm,
        locationExpanded: false,
      },
    };
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
