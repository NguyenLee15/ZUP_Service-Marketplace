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
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = new ReviewsService(
      prisma as unknown as PrismaService,
      { enqueue: jest.fn().mockResolvedValue(undefined) } as unknown as JobsService,
      { moderateReview: jest.fn().mockResolvedValue(false) } as unknown as AiService,
    );

    await service.createReview(7, 99, 5, 'Great service');

    expect(tx.review.aggregate).toHaveBeenCalledWith({
      where: { serviceId: 42, isFlagged: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
  });
});
