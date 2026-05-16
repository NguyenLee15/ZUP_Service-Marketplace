import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../../shared/mail/mail.service';
import { Logger } from '@nestjs/common';

@Processor('auth-queue')
export class AuthProcessor extends WorkerHost {
  private readonly logger = new Logger(AuthProcessor.name);

  constructor(private mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'auth.send-otp':
        return this.mailService.sendOtp(job.data.email, job.data.otp);
      case 'auth.send-reset':
        return this.mailService.sendPasswordResetLink(
          job.data.email,
          job.data.resetLink,
        );
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
