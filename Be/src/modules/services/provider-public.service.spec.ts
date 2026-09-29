import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderPublicService } from './provider-public.service';
import { ServiceReviewsQueryDto } from './dto/service-reviews-query.dto';

describe('ServiceReviewsQueryDto', () => {
  it('rejects review queries outside the public bounds', async () => {
    const dto = plainToInstance(ServiceReviewsQueryDto, {
      page: 0,
      limit: 51,
      rating: 6,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'limit', 'rating']),
    );
  });
});

describe('ProviderPublicService reviews', () => {
  it('excludes flagged reviews from the rating distribution query', async () => {
    const prisma = {
      review: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ProviderPublicService(
      prisma as unknown as PrismaService,
    );

    await service.getServiceReviews(42);

    expect(prisma.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { serviceId: 42, isFlagged: false },
      }),
    );
  });

  it('excludes flagged reviews from provider rating aggregates', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 7,
          fullName: 'Provider',
          phone: null,
          addresses: [],
        }),
      },
      review: {
        aggregate: jest.fn().mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { rating: 2 },
        }),
      },
      service: { count: jest.fn().mockResolvedValue(1) },
      booking: { groupBy: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const service = new ProviderPublicService(
      prisma as unknown as PrismaService,
    );

    await service.getPublicProviderProfile(7);

    expect(prisma.review.aggregate).toHaveBeenCalledWith({
      where: {
        isFlagged: false,
        service: { providerId: 7, isDeleted: false },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });
  });
});
