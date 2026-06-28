import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStatus, Prisma } from '@prisma/client';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingSharedService {
  private readonly logger = new Logger(BookingSharedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkActiveUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' },
    });
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản của bạn đã bị khóa hoặc không tồn tại',
      });
    }
    return user;
  }

  async checkBooking(
    bookingId: number,
    opts: {
      customerId?: number;
      providerId?: number;
      status?: BookingStatus | BookingStatus[];
      includeService?: boolean;
    },
  ) {
    if (opts.customerId) await this.checkActiveUser(opts.customerId);
    if (opts.providerId) await this.checkActiveUser(opts.providerId);

    const where: Prisma.BookingWhereInput = { id: bookingId };
    if (opts.customerId) where.customerId = opts.customerId;
    if (opts.providerId) where.providerId = opts.providerId;

    const booking = await this.prisma.booking.findFirst({
      where,
      include: opts.includeService ? { service: true } : undefined,
    });
    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }
    if (opts.status) {
      const allowedStatuses = Array.isArray(opts.status)
        ? opts.status
        : [opts.status];
      if (!allowedStatuses.includes(booking.status)) {
        throw new BadRequestException({
          code: ErrorCodes.BOOKING_INVALID_STATE,
          message: `Đơn hàng không ở trạng thái phù hợp (hiện tại: ${booking.status})`,
        });
      }
    }
    return booking;
  }

  async addStatusHistory(
    bookingId: number,
    from: string,
    to: string,
    changedBy: number,
    note?: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await tx.bookingStatusHistory.create({
      data: { bookingId, fromStatus: from, toStatus: to, changedBy, note },
    });
  }

  async linkConversationToBooking(
    bookingId: number,
    customerId: number,
    providerId: number,
    serviceId: number,
  ) {
    try {
      const existingByBooking = await this.prisma.conversation.findUnique({
        where: { bookingId },
      });
      if (existingByBooking) return;

      const existingByService = await this.prisma.conversation.findFirst({
        where: { customerId, providerId, serviceId },
      });

      if (existingByService) {
        await this.prisma.conversation.update({
          where: { id: existingByService.id },
          data: { bookingId },
        });
        return;
      }

      await this.prisma.conversation.create({
        data: { bookingId, customerId, providerId, serviceId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to link conversation for booking #${bookingId}: ${message}`,
      );
    }
  }

  notify(
    userId: number,
    type: string,
    title: string,
    content: string,
    referenceId: number,
  ): Promise<void> {
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SEND, {
      userId,
      type,
      title,
      content,
      referenceId,
    });
    return Promise.resolve();
  }

  isBookingStatus(value: unknown): value is BookingStatus {
    return (
      typeof value === 'string' &&
      Object.values(BookingStatus).includes(value as BookingStatus)
    );
  }
}
