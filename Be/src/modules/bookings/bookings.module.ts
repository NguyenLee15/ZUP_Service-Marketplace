import { Module } from '@nestjs/common';
import {
  BookingsController,
  ProviderBookingsController,
  AdminDisputesController,
} from './bookings.controller';
import { ProviderDashboardController } from './provider-dashboard.controller';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { BookingsCron } from './bookings.cron';
import { BullModule } from '@nestjs/bullmq';
import { BookingsProcessor } from './bookings.processor';
import { DisputeProcessor } from './dispute.processor';
import { RedisModule } from '../../shared/redis/redis.module';
import { AiModule } from '../../shared/ai/ai.module';
import {
  isCronEnabled,
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';
import { TrackingGateway } from './tracking.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingLifecycleService } from './booking-lifecycle.service';
import { BookingDisputeService } from './booking-dispute.service';
import { BookingQueryService } from './booking-query.service';
import { ProviderDashboardService } from './provider-dashboard.service';
import { CustomerBookingExportService } from './customer-booking-export.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingTimeoutService } from './booking-timeout.service';

@Module({
  imports: [
    CloudinaryModule,
    RedisModule,
    AiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('app.jwtSecret'),
      }),
      inject: [ConfigService],
    }),
    ...(isRedisQueueEnabled()
      ? [
          BullModule.registerQueue({ name: 'booking-queue' }),
          BullModule.registerQueue({ name: 'dispute_queue' }),
        ]
      : []),
  ],
  controllers: [
    BookingsController,
    ProviderBookingsController,
    AdminDisputesController,
    ProviderDashboardController,
  ],
  providers: [
    BookingCommissionService,
    BookingSharedService,
    BookingTimeoutService,
    BookingStatePolicy,
    BookingLifecycleService,
    BookingDisputeService,
    BookingQueryService,
    ProviderDashboardService,
    CustomerBookingExportService,
    TrackingGateway,
    ...(isCronEnabled() ? [BookingsCron] : []),
    ...(isWorkerEnabled() ? [BookingsProcessor, DisputeProcessor] : []),
  ],
  exports: [
    BookingLifecycleService,
    BookingDisputeService,
    BookingQueryService,
    ProviderDashboardService,
    CustomerBookingExportService,
    BookingCommissionService,
    BookingSharedService,
    BookingTimeoutService,
  ],
})
export class BookingsModule {}
