import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';

const JOB_QUEUE_MAP: Record<string, string> = {
  'auth.send-otp': 'auth-queue',
  'auth.send-reset': 'auth-queue',
  'service.generate-embedding': 'ai-queue',
  'service.auto-hide-violating': 'ai-queue',
  'chat.ai-reply': 'ai-queue',
  moderate_review: 'review_queue',
  analyze_dispute: 'dispute_queue',
  'booking.auto-complete': 'booking-queue',
  'booking.sla-noshow-alert': 'booking-queue',
  'booking.sla-stuck-inprogress': 'booking-queue',
};

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly mailService: MailService,
  ) {}

  async enqueue(jobName: string, payload: Record<string, any>): Promise<void> {
    const queueMode =
      this.configService.get<string>('runtime.queueMode') || 'inline';

    if (queueMode === 'redis') {
      await this.enqueueRedis(jobName, payload);
      return;
    }

    await this.runInline(jobName, payload);
  }

  private async enqueueRedis(
    jobName: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const queueName = JOB_QUEUE_MAP[jobName];
    if (!queueName) {
      this.logger.warn(`Unknown job "${jobName}". Skipping.`);
      return;
    }

    let queue: Queue | undefined;
    try {
      queue = this.moduleRef.get<Queue>(getQueueToken(queueName), {
        strict: false,
      });
    } catch {
      queue = undefined;
    }

    if (!queue) {
      this.logger.warn(
        `Queue "${queueName}" is not registered. Skipping "${jobName}".`,
      );
      return;
    }

    await queue.add(jobName, payload);
  }

  private async runInline(
    jobName: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      switch (jobName) {
        case 'auth.send-otp':
          await this.mailService.sendOtp(payload.email, payload.otp);
          return;
        case 'auth.send-reset':
          await this.mailService.sendPasswordResetLink(
            payload.email,
            payload.resetLink,
          );
          return;
        default:
          this.logger.debug(
            `Inline queue skipped non-critical job "${jobName}".`,
          );
      }
    } catch (error) {
      this.logger.warn(`Inline job "${jobName}" failed: ${error.message}`);
      if (jobName.startsWith('auth.')) {
        throw error;
      }
    }
  }
}
