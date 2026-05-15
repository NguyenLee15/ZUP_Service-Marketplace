import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../../shared/ai/ai.module';
import { ReviewProcessor } from './review.processor';
import {
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

@Module({
  imports: [
    AiModule,
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'review_queue' })]
      : []),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ...(isWorkerEnabled() ? [ReviewProcessor] : [])],
  exports: [ReviewsService],
})
export class ReviewsModule {}
