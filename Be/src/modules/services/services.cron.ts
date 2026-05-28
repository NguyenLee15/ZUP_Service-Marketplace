import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';

@Injectable()
export class ServicesCron {
  private readonly logger = new Logger(ServicesCron.name);

  constructor(private jobsService: JobsService) {}

  /**
   * Chạy mỗi tuần vào Chủ Nhật lúc 0h.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleAutoHideViolating() {
    this.logger.debug('Adding auto-hide violating services job to queue...');
    await this.jobsService.enqueue(JobName.ServiceAutoHideViolating, {});
  }
}
