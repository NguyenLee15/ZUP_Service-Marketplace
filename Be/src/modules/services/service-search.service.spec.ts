import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { RedisService } from '../../shared/redis/redis.service';
import { ServiceSearchService } from './service-search.service';

describe('ServiceSearchService location search', () => {
  it('uses database-ranked location rows and returns paginated results', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 2,
          distanceKm: 1.5,
          totalCount: 51,
          providerAddress: 'Address 2',
        },
      ]),
      service: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            providerId: 7,
            featuredListings: [],
            category: { id: 1, name: 'Cleaning' },
            provider: { id: 7, fullName: 'Provider', avatarUrl: null },
            images: [],
          },
        ]),
      },
    };
    const service = new ServiceSearchService(
      prisma as unknown as PrismaService,
      { getState: jest.fn() } as unknown as AiService,
      {
        isEnabled: jest.fn().mockReturnValue(false),
        get: jest.fn(),
        getJson: jest.fn(),
        set: jest.fn(),
        setJson: jest.fn(),
        delByPattern: jest.fn(),
      } as unknown as RedisService,
    );

    const result = await service.search({
      lat: 10,
      lng: 106,
      page: 2,
      limit: 25,
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [2] } } }),
    );
    expect(result.meta).toMatchObject({ total: 51, page: 2, limit: 25 });
    expect(result.data[0]).toMatchObject({
      distanceKm: 1.5,
      providerAddress: 'Address 2',
    });
  });

  it('uses Redis for non-location search cache when enabled', async () => {
    const cached = {
      data: [{ id: 9 }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    const prisma = {
      service: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    const redis = {
      isEnabled: jest.fn().mockReturnValue(true),
      getJson: jest.fn().mockResolvedValue(cached),
      setJson: jest.fn(),
      delByPattern: jest.fn(),
    };
    const service = new ServiceSearchService(
      prisma as unknown as PrismaService,
      { getState: jest.fn() } as unknown as AiService,
      redis as unknown as RedisService,
    );

    await expect(service.search({ keyword: 'cleaning' })).resolves.toEqual(
      cached,
    );
    expect(redis.getJson).toHaveBeenCalledWith(
      expect.stringMatching(/^service_search:/),
    );
    expect(prisma.service.findMany).not.toHaveBeenCalled();
  });
});
