import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../shared/jobs/jobs.service';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  /**
   * Chạy mỗi giờ. Tìm các đơn DONE quá 24h để tự động chốt.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoCompletion() {
    this.logger.debug('Adding auto-completion jobs to queue...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueBookings = await this.prisma.booking.findMany({
      where: {
        status: 'DONE',
        completedAt: { lte: twentyFourHoursAgo },
        autoCompletedAt: null,
      },
      select: { id: true },
    });

    for (const booking of overdueBookings) {
      await this.jobsService.enqueue('booking.auto-complete', {
        bookingId: booking.id,
      });
    }
  }

  /**
   * Chạy mỗi 30 phút. SLA No-show: 4h quá giờ hẹn mà chưa Start.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleSlaNoshow() {
    this.logger.debug('Adding SLA No-show alert jobs to queue...');
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const noshowBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        desiredTime: { lte: fourHoursAgo },
      },
      select: { id: true },
    });

    for (const booking of noshowBookings) {
      await this.jobsService.enqueue('booking.sla-noshow-alert', {
        bookingId: booking.id,
      });
    }
  }

  /**
   * Chạy 8AM hàng ngày. SLA Stuck In-Progress.
   */
  @Cron('0 8 * * *')
  async handleSlaStuckInProgress() {
    this.logger.debug('Adding SLA Stuck In-Progress jobs to queue...');
    // Quá 7 ngày tự động DONE (giả định)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stuckBookings = await this.prisma.booking.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lte: sevenDaysAgo }, // Booking không có updatedAt, dùng createdAt làm mốc
      },
      select: { id: true },
    });

    for (const booking of stuckBookings) {
      await this.jobsService.enqueue('booking.sla-stuck-inprogress', {
        bookingId: booking.id,
      });
    }
  }
}
