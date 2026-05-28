import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';

export enum JobName {
  AuthSendOtp = 'auth.send-otp',
  AuthSendReset = 'auth.send-reset',
  ServiceGenerateEmbedding = 'service.generate-embedding',
  ServiceAutoHideViolating = 'service.auto-hide-violating',
  ChatAiReply = 'chat.ai-reply',
  ModerateReview = 'moderate_review',
  AnalyzeDispute = 'analyze_dispute',
  BookingAutoComplete = 'booking.auto-complete',
  BookingSlaNoShowAlert = 'booking.sla-noshow-alert',
  BookingSlaStuckInProgress = 'booking.sla-stuck-inprogress',
}

export interface AuthSendOtpPayload {
  email: string;
  otp: string;
}

export interface AuthSendResetPayload {
  email: string;
  resetLink: string;
}

export interface ServiceGenerateEmbeddingPayload {
  serviceId: number;
  name: string;
  description: string;
}

export type EmptyJobPayload = Record<string, never>;

export interface ChatAiReplyPayload {
  conversationId: number;
  customerId: number;
  providerId: number;
  lastMessage: string;
}

export interface ModerateReviewPayload {
  reviewId: number;
  comment?: string | null;
}

export interface AnalyzeDisputePayload {
  disputeId: number;
  reason: string;
}

export interface BookingIdPayload {
  bookingId: number;
}

export interface JobPayloadMap {
  [JobName.AuthSendOtp]: AuthSendOtpPayload;
  [JobName.AuthSendReset]: AuthSendResetPayload;
  [JobName.ServiceGenerateEmbedding]: ServiceGenerateEmbeddingPayload;
  [JobName.ServiceAutoHideViolating]: EmptyJobPayload;
  [JobName.ChatAiReply]: ChatAiReplyPayload;
  [JobName.ModerateReview]: ModerateReviewPayload;
  [JobName.AnalyzeDispute]: AnalyzeDisputePayload;
  [JobName.BookingAutoComplete]: BookingIdPayload;
  [JobName.BookingSlaNoShowAlert]: BookingIdPayload;
  [JobName.BookingSlaStuckInProgress]: BookingIdPayload;
}

export type JobPayload = JobPayloadMap[JobName];

const JOB_QUEUE_MAP: Record<JobName, string> = {
  [JobName.AuthSendOtp]: 'auth-queue',
  [JobName.AuthSendReset]: 'auth-queue',
  [JobName.ServiceGenerateEmbedding]: 'ai-queue',
  [JobName.ServiceAutoHideViolating]: 'ai-queue',
  [JobName.ChatAiReply]: 'ai-queue',
  [JobName.ModerateReview]: 'review_queue',
  [JobName.AnalyzeDispute]: 'dispute_queue',
  [JobName.BookingAutoComplete]: 'booking-queue',
  [JobName.BookingSlaNoShowAlert]: 'booking-queue',
  [JobName.BookingSlaStuckInProgress]: 'booking-queue',
};

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly mailService: MailService,
  ) {}

  async enqueue<T extends JobName>(
    jobName: T,
    payload: JobPayloadMap[T],
  ): Promise<void> {
    const queueMode =
      this.configService.get<string>('runtime.queueMode') || 'inline';

    if (queueMode === 'redis') {
      await this.enqueueRedis(jobName, payload);
      return;
    }

    await this.runInline(jobName, payload);
  }

  private async enqueueRedis(
    jobName: JobName,
    payload: JobPayload,
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
    jobName: JobName,
    payload: JobPayload,
  ): Promise<void> {
    try {
      switch (jobName) {
        case JobName.AuthSendOtp: {
          const authPayload = payload as AuthSendOtpPayload;
          await this.mailService.sendOtp(authPayload.email, authPayload.otp);
          return;
        }
        case JobName.AuthSendReset: {
          const authPayload = payload as AuthSendResetPayload;
          await this.mailService.sendPasswordResetLink(
            authPayload.email,
            authPayload.resetLink,
          );
          return;
        }
        default:
          this.logger.debug(
            `Inline queue skipped non-critical job "${jobName}".`,
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Inline job "${jobName}" failed: ${message}`);
      if (jobName.startsWith('auth.')) {
        throw error;
      }
    }
  }
}
