import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  NOTIFICATION_EVENTS,
  type NotificationEventPayload,
} from '../../common/events/notification-events';
import { PrismaService } from '../../prisma/prisma.service';
import type { ExpoPushMessage } from 'expo-server-sdk';

type ExpoModule = typeof import('expo-server-sdk');
type ExpoClient = InstanceType<ExpoModule['Expo']>;

/**
 * Centralized notification event listener.
 * Nhận event từ EventEmitter2, persist vào DB qua NotificationsService,
 * và push realtime qua WebSocket gateway.
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger('NotificationListener');
  private expoModule?: ExpoModule;
  private expo?: ExpoClient;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.SEND)
  async handleNotificationSend(payload: NotificationEventPayload) {
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

      // 3. Push ra ngoài app. Fire-and-forget để không block luồng nghiệp vụ.
      void this.sendPushNotification(payload, notification.id);
    } catch (error) {
      // Fire-and-forget: log lỗi nhưng không throw để không block caller
      this.logger.error(
        `Failed to process notification for user #${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async getExpoModule(): Promise<ExpoModule> {
    this.expoModule ??= await import('expo-server-sdk');
    return this.expoModule;
  }

  private async getExpoClient(): Promise<ExpoClient> {
    const { Expo } = await this.getExpoModule();
    this.expo ??= new Expo();
    return this.expo;
  }

  private async sendPushNotification(
    payload: NotificationEventPayload,
    notificationId: number,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { expoPushToken: true },
      });

      if (!user?.expoPushToken) return;

      const { Expo } = await this.getExpoModule();
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        this.logger.warn(
          `Invalid expo push token for user #${payload.userId}: ${user.expoPushToken}`,
        );
        return;
      }

      const message: ExpoPushMessage = {
        to: user.expoPushToken,
        sound: 'default',
        title: payload.title,
        body: payload.content,
        data: {
          notificationId,
          type: payload.type,
          referenceId: payload.referenceId,
          bookingId: payload.referenceId,
        },
      };

      const expo = await this.getExpoClient();
      const chunks = expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to push notification for user #${payload.userId}: ${error.message}`,
      );
    }
  }
}
