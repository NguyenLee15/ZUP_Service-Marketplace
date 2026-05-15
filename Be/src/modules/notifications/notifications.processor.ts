import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ExpoPushMessage } from 'expo-server-sdk';

type ExpoModule = typeof import('expo-server-sdk');
type ExpoClient = InstanceType<ExpoModule['Expo']>;

@Processor('notification-queue')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private expoModule?: ExpoModule;
  private expo?: ExpoClient;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'notification.push':
        return this.handlePushNotification(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
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

  private async handlePushNotification(data: {
    userId: number;
    title: string;
    content: string;
  }) {
    this.logger.log(
      `Pushing notification to user #${data.userId}: ${data.title}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { expoPushToken: true },
      });

      if (!user?.expoPushToken) {
        this.logger.log(
          `User #${data.userId} has no expo push token. Skipping.`,
        );
        return;
      }

      const { Expo } = await this.getExpoModule();
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        this.logger.warn(
          `Invalid expo push token for user #${data.userId}: ${user.expoPushToken}`,
        );
        return;
      }

      const messages: ExpoPushMessage[] = [
        {
          to: user.expoPushToken,
          sound: 'default',
          title: data.title,
          body: data.content,
          data: { withSome: 'data' },
        },
      ];

      const expo = await this.getExpoClient();
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error(`Error sending push notification chunk: ${error}`);
        }
      }
      this.logger.log(`Notification delivered to user #${data.userId}`);
    } catch (e) {
      this.logger.error(
        `Failed to push notification to user #${data.userId}`,
        e,
      );
    }
  }
}
