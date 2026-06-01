import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationListener } from './notification.listener';

import { BullModule } from '@nestjs/bullmq';

import { NotificationProcessor } from './notifications.processor';
import {
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret'),
      }),
      inject: [ConfigService],
    }),
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'notification-queue' })]
      : []),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    ...(isWorkerEnabled() ? [NotificationProcessor] : []),
    NotificationListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
