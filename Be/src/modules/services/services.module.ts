import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ServicesController,
  AdminServicesController,
} from './services.controller';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { AiModule } from '../../shared/ai/ai.module';
import { BullModule } from '@nestjs/bullmq';

import { ServicesProcessor } from './services.processor';

import { ServicesCron } from './services.cron';
import { FeaturedListingsService } from './featured-listings.service';
import {
  isCronEnabled,
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

@Module({
  imports: [
    CloudinaryModule,
    AiModule,
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'ai-queue' })]
      : []),
  ],
  controllers: [ServicesController, AdminServicesController],
  providers: [
    ServicesService,
    ...(isWorkerEnabled() ? [ServicesProcessor] : []),
    ...(isCronEnabled() ? [ServicesCron] : []),
    FeaturedListingsService,
  ],
  exports: [ServicesService, FeaturedListingsService],
})
export class ServicesModule {}
