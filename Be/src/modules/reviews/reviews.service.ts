import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { Prisma } from '@prisma/client';
import { AiService } from '../../shared/ai/ai.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger('ReviewsService');

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
    private aiService: AiService,
  ) {}

  async createReview(
    customerId: number,
    bookingId: number,
    rating: number,
    comment?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId, status: 'ACTIVE' },
    });
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản của bạn đã bị khóa hoặc không tồn tại',
      });
    }

    // Kiểm tra booking thuộc customer + đã DONE + autoCompletedAt ghi rồi
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i',
      });
    }

    if (!booking.autoCompletedAt) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'ChÆ°a Ä‘á»§ Ä‘iá»u kiá»‡n Ä‘Ã¡nh giÃ¡',
      });
    }

    // Kiá»ƒm tra chÆ°a Ä‘Ã¡nh giÃ¡
    const existing = await this.prisma.review.findUnique({
      where: { bookingId },
    });
    if (existing) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ Ä‘Æ¡n nÃ y rá»“i',
      });
    }

    let isFlagged = false;
    if (comment && comment.trim().length > 0) {
      try {
        isFlagged = await this.aiService.moderateReview(comment);
        if (isFlagged) {
          this.logger.warn(`AI Moderation flagged review for booking ${bookingId}`);
        }
      } catch (error) {
        this.logger.error('AI Moderation failed, skipping...', error);
        // Fallback: don't block review if AI fails
      }
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId,
        customerId,
        serviceId: booking.serviceId,
        rating,
        comment,
        isFlagged,
      },
    });

    // Cáº­p nháº­t avgRating + totalReviews trÃªn Service
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

    // Báº¯n event kiá»ƒm duyá»‡t AI náº¿u cÃ³ comment
    if (comment) {
      await this.jobsService.enqueue(JobName.ModerateReview, {
        reviewId: review.id,
        comment,
      });
    }

    return { data: review, message: 'ÄÃ¡nh giÃ¡ thÃ nh cÃ´ng' };
  }

  async getServiceReviews(
    serviceId: number,
    rating?: number,
    page = 1,
    limit = 10,
  ) {
    const where: Prisma.ReviewWhereInput = { serviceId, isFlagged: false };
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

