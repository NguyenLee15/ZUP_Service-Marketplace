import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
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

@Module({
  imports: [
    CloudinaryModule,
    RedisModule,
    AiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          secret: configService.getOrThrow<string>('app.jwtSecret'),
        }) as any,
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
    BookingsService,
    TrackingGateway,
    ...(isCronEnabled() ? [BookingsCron] : []),
    ...(isWorkerEnabled() ? [BookingsProcessor, DisputeProcessor] : []),
  ],
  exports: [BookingsService],
})
export class BookingsModule {}

