import { Module } from '@nestjs/common';
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
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
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
