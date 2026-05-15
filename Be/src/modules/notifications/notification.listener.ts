import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';

/**
 * Centralized notification event listener.
 * Nhận event từ EventEmitter2, persist vào DB qua NotificationsService,
 * và push realtime qua WebSocket gateway.
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger('NotificationListener');

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.SEND)
  async handleNotificationSend(payload: {
    userId: number;
    type: string;
    title: string;
    content: string;
    referenceId?: number;
  }) {
    try {
      // 1. Persist vào DB
      const notification = await this.notificationsService.create(
        payload.userId,
        payload.type,
        payload.title,
        payload.content,
        payload.referenceId,
      );

      // 2. Push realtime qua WebSocket
      this.notificationsGateway.sendNotificationToUser(
        payload.userId,
        notification,
      );
    } catch (error) {
      // Fire-and-forget: log lỗi nhưng không throw để không block caller
      this.logger.error(
        `Failed to process notification for user #${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
