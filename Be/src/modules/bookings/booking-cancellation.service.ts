import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingTimeoutService } from './booking-timeout.service';
import { CancelBookingDto } from './dto/bookings.dto';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class BookingCancellationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: BookingSharedService,
    private readonly bookingStatePolicy: BookingStatePolicy,
    private readonly bookingCommissionService: BookingCommissionService,
    private readonly bookingTimeoutService: BookingTimeoutService,
    private readonly redisService: RedisService,
  ) {}

  async cancelByProvider(
    providerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    await this.shared.checkActiveUser(providerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, providerId },
    });
    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (
      !(
        [
          BookingStatus.PENDING,
          BookingStatus.ACCEPTED,
          BookingStatus.QUOTED,
        ] as BookingStatus[]
      ).includes(booking.status)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message:
          'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý, Đang đến hoặc Đã báo giá',
      });
    }

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.CANCELLED,
    );
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.shared.addStatusHistory(
      bookingId,
      booking.status,
      'CANCELLED',
      providerId,
      dto.reason,
    );
    await this.shared.notify(
      booking.customerId,
      'BOOKING_CANCELLED',
      'Đơn hàng bị hủy',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã hủy đơn' };
  }

  async cancelByCustomer(
    customerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    await this.shared.checkActiveUser(customerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId },
    });
    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (
      !(
        [
          BookingStatus.PENDING,
          BookingStatus.ACCEPTED,
          BookingStatus.QUOTED,
        ] as BookingStatus[]
      ).includes(booking.status)
    ) {
      const canCancelFree = await this.redisService.exists(
        `booking:noshow:${bookingId}`,
      );

      if (!(booking.status === BookingStatus.CONFIRMED && canCancelFree)) {
        throw new BadRequestException({
          code: ErrorCodes.BOOKING_INVALID_STATE,
          message:
            'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý, Đang đến hoặc Đã báo giá',
        });
      }
    }

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.CANCELLED,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      await tx.quotation.updateMany({
        where: { bookingId, status: { in: ['PENDING', 'ACCEPTED'] } },
        data: { status: 'REJECTED' },
      });

      await this.shared.addStatusHistory(
        bookingId,
        booking.status,
        'CANCELLED',
        customerId,
        dto.reason,
        tx,
      );

      return b;
    });

    await this.shared.notify(
      booking.providerId,
      'BOOKING_CANCELLED',
      'Đơn hàng bị hủy',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã hủy đơn' };
  }

  async cancelByAdmin(
    adminId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    await this.shared.checkActiveUser(adminId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
        providerId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (
      (
        [
          BookingStatus.CANCELLED,
          BookingStatus.DONE,
          BookingStatus.DISPUTED,
        ] as BookingStatus[]
      ).includes(booking.status)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Không thể hủy đơn đã hủy, đã hoàn thành hoặc đang tranh chấp',
      });
    }

    const reason = dto.reason || 'Admin hủy đơn theo yêu cầu đặc biệt';
    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.CANCELLED,
    );
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.shared.addStatusHistory(
      bookingId,
      booking.status,
      'CANCELLED',
      adminId,
      `Admin hủy đơn: ${reason}`,
    );

    await this.shared.notify(
      booking.customerId,
      'BOOKING_CANCELLED_BY_ADMIN',
      'Đơn hàng đã được hủy',
      `Đơn #${booking.bookingCode}: ${reason}`,
      bookingId,
    );
    await this.shared.notify(
      booking.providerId,
      'BOOKING_CANCELLED_BY_ADMIN',
      'Đơn hàng đã được hủy',
      `Đơn #${booking.bookingCode}: ${reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã hủy đơn' };
  }
}
