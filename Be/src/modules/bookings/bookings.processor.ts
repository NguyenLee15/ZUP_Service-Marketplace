import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';

import { RedisService } from '../../shared/redis/redis.service';
import { BookingIdPayload, JobName } from '../../shared/jobs/jobs.service';
import { BookingCommissionService } from './booking-commission.service';

@Processor('booking-queue')
export class BookingsProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2,
    private commissionService: BookingCommissionService,
  ) {
    super();
  }

  async process(job: Job<BookingIdPayload, void, JobName>): Promise<void> {
    switch (job.name) {
      case JobName.BookingAutoComplete:
        await this.handleAutoComplete(job.data.bookingId);
        return;
      case JobName.BookingSlaNoShowAlert:
        await this.handleNoshowAlert(job.data.bookingId);
        return;
      case JobName.BookingSlaStuckInProgress:
        await this.handleStuckInProgress(job.data.bookingId);
        return;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleAutoComplete(bookingId: number) {
    this.logger.log(`Processing auto-complete for booking #${bookingId}`);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { quotations: { where: { status: 'ACCEPTED' } } },
      });

      if (!booking || booking.status !== 'DONE' || booking.autoCompletedAt) {
        return;
      }

      // 1. Cập nhật autoCompletedAt
      await tx.booking.update({
        where: { id: bookingId },
        data: { autoCompletedAt: new Date() },
      });

      // 2. Ghi log timeline
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: 'DONE',
          toStatus: 'DONE',
          changedBy: 0, // System
          note: 'Hệ thống tự động chốt đơn sau 24h',
        },
      });

      // 3. Trừ hoa hồng
      await this.commissionService.deductCommission(booking.id, booking.customerId, tx);
    });
  }

  private async handleNoshowAlert(bookingId: number) {
    this.logger.log(`Processing No-show alert for booking #${bookingId}`);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.status !== 'CONFIRMED') return;

    // Emit event thay vì gọi prisma trực tiếp — NotificationListener xử lý
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SEND, {
      userId: booking.customerId,
      type: 'SLA_NOSHOW',
      title: 'Nhà cung cấp chưa đến?',
      content: `Đơn hàng #${booking.bookingCode} đã quá giờ hẹn khảo sát. Bạn có thể chọn hủy đơn nếu Nhà cung cấp không phản hồi.`,
      referenceId: bookingId,
    });

    // Set flag in Redis to allow free cancellation even if CONFIRMED
    await this.redisService.set(
      `booking:noshow:${bookingId}`,
      'true',
      24 * 60 * 60,
    );
  }

  private async handleStuckInProgress(bookingId: number) {
    this.logger.log(`Processing Stuck In-Progress for booking #${bookingId}`);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.status !== 'IN_PROGRESS') return;

    // Logic: Nếu quá Y ngày -> Cảnh báo. Nếu quá Z ngày -> Tự động chuyển DONE.
    // Giả sử job này được add khi đạt mốc Z ngày.
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'DONE', completedAt: new Date() },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'DONE',
          changedBy: 0,
          note: 'Hệ thống tự động chuyển DONE do đơn hàng ở trạng thái IN_PROGRESS quá lâu',
        },
      });
    });
  }
}
