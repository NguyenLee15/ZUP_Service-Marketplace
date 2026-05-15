import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';

@Processor('review_queue')
export class ReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { reviewId, comment } = job.data;

    if (!comment) return;

    this.logger.log(`Moderating review ID: ${reviewId}`);

    try {
      const isToxic = await this.aiService.moderateReview(comment);

      if (isToxic) {
        await this.prisma.review.update({
          where: { id: reviewId },
          data: { isFlagged: true },
        });

        this.logger.warn(`Review ID ${reviewId} flagged as TOXIC!`);
      } else {
        this.logger.log(`Review ID ${reviewId} is clean.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to moderate review ID ${reviewId}: ${error.message}`,
      );
      throw error;
    }
  }
}
