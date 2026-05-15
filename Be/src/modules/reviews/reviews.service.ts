import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger('ReviewsService');

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async createReview(
    customerId: number,
    bookingId: number,
    rating: number,
    comment?: string,
  ) {
    // Kiểm tra booking thuộc customer + đã DONE + autoCompletedAt ghi rồi
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (!booking.autoCompletedAt) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Chưa đủ điều kiện đánh giá',
      });
    }

    // Kiểm tra chưa đánh giá
    const existing = await this.prisma.review.findUnique({
      where: { bookingId },
    });
    if (existing) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Bạn đã đánh giá đơn này rồi',
      });
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId,
        customerId,
        serviceId: booking.serviceId,
        rating,
        comment,
      },
    });

    // Cập nhật avgRating + totalReviews trên Service
    const stats = await this.prisma.review.aggregate({
      where: { serviceId: booking.serviceId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.service.update({
      where: { id: booking.serviceId },
      data: {
        avgRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    });

    // Bắn event kiểm duyệt AI nếu có comment
    if (comment) {
      await this.jobsService.enqueue('moderate_review', {
        reviewId: review.id,
        comment,
      });
    }

    return { data: review, message: 'Đánh giá thành công' };
  }

  async getServiceReviews(
    serviceId: number,
    rating?: number,
    page = 1,
    limit = 10,
  ) {
    const where: any = { serviceId, isFlagged: false };
    if (rating) where.rating = rating;

    const [data, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { serviceId },
        _count: { rating: true },
      }),
    ]);

    // Distribution: {1: count, 2: count, ...}
    const distribution = Object.fromEntries(
      [1, 2, 3, 4, 5].map((r) => [
        r,
        stats.find((s) => s.rating === r)?._count?.rating || 0,
      ]),
    );

    return { data, meta: { total, page, limit, distribution } };
  }
}
