import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ServicesController,
  AdminServicesController,
  AdminFeaturedListingsController,
  AdminFeaturedRateController,
} from './controllers';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { AiModule } from '../../shared/ai/ai.module';
import { BullModule } from '@nestjs/bullmq';

import { ServicesProcessor } from './services.processor';

import { ServicesCron } from './services.cron';
import { FeaturedListingsService } from './featured-listings.service';
import { FeaturedListingsCron } from './featured-listings.cron';
import { ProviderPublicService } from './provider-public.service';
import { ServiceCommandService } from './service-command.service';
import { ServiceModerationService } from './service-moderation.service';
import { ServiceSearchService } from './service-search.service';
import { ServiceSharedService } from './service-shared.service';
import {
  isCronEnabled,
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

import { ProviderWalletsModule } from '../provider-wallets/provider-wallets.module';

@Module({
  imports: [
    CloudinaryModule,
    AiModule,
    ProviderWalletsModule,
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'ai-queue' })]
      : []),
  ],
  controllers: [
    ServicesController,
    AdminServicesController,
    AdminFeaturedListingsController,
    AdminFeaturedRateController,
  ],
  providers: [
    ServiceSharedService,
    ServiceCommandService,
    ServiceModerationService,
    ServiceSearchService,
    ProviderPublicService,
    ServicesService,
    ...(isWorkerEnabled() ? [ServicesProcessor] : []),
    ...(isCronEnabled() ? [ServicesCron, FeaturedListingsCron] : []),
    FeaturedListingsService,
  ],
  exports: [
    ServicesService,
    ServiceCommandService,
    ServiceModerationService,
    ServiceSearchService,
    ProviderPublicService,
    FeaturedListingsService,
  ],
})
export class ServicesModule {}
