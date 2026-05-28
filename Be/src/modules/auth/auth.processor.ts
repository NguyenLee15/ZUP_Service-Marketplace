import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../../shared/mail/mail.service';
import { Logger } from '@nestjs/common';
import {
  AuthSendOtpPayload,
  AuthSendResetPayload,
  JobName,
} from '../../shared/jobs/jobs.service';

@Processor('auth-queue')
export class AuthProcessor extends WorkerHost {
  private readonly logger = new Logger(AuthProcessor.name);

  constructor(private mailService: MailService) {
    super();
  }

  async process(
    job: Job<AuthSendOtpPayload | AuthSendResetPayload, void, JobName>,
  ): Promise<void> {
    switch (job.name) {
      case JobName.AuthSendOtp: {
        const data = job.data as AuthSendOtpPayload;
        await this.mailService.sendOtp(data.email, data.otp);
        return;
      }
      case JobName.AuthSendReset: {
        const data = job.data as AuthSendResetPayload;
        await this.mailService.sendPasswordResetLink(
          data.email,
          data.resetLink,
        );
        return;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
