import { BookingStatus, DisputeStatus } from '@prisma/client';
import { AiService } from '../../shared/ai/ai.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService rating integrity', () => {
  it('excludes flagged reviews when refreshing service aggregates', async () => {
    const tx = {
      review: {
        create: jest.fn().mockResolvedValue({ id: 91 }),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { rating: 4.5 },
          _count: { rating: 2 },
        }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      service: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      booking: {
        findFirst: jest.fn().mockResolvedValue({
          serviceId: 42,
          status: BookingStatus.DONE,
          autoCompletedAt: new Date(),
          dispute: { status: DisputeStatus.RESOLVED },
        }),
      },
      review: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new ReviewsService(
      prisma as unknown as PrismaService,
      {
        enqueue: jest.fn().mockResolvedValue(undefined),
      } as unknown as JobsService,
      {
        moderateReview: jest.fn().mockResolvedValue(false),
      } as unknown as AiService,
    );

    await service.createReview(7, 99, 5, 'Great service');

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.review.aggregate.mock.invocationCallOrder[0],
    );
    expect(tx.review.aggregate).toHaveBeenCalledWith({
      where: { serviceId: 42, isFlagged: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
  });

  it('excludes flagged reviews from service review results and aggregates', async () => {
    const prisma = {
      review: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ReviewsService(
      prisma as unknown as PrismaService,
      {} as JobsService,
      {} as AiService,
    );

    await service.getServiceReviews(42);

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { serviceId: 42, isFlagged: false } }),
    );
    expect(prisma.review.count).toHaveBeenCalledWith({
      where: { serviceId: 42, isFlagged: false },
    });
    expect(prisma.review.groupBy).toHaveBeenCalledWith({
      by: ['rating'],
      where: { serviceId: 42, isFlagged: false },
      _count: { rating: true },
    });
  });
});
