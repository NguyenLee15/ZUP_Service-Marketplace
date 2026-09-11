import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { RedisService } from '../../shared/redis/redis.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';

@Injectable()
export class BookingExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisService,
    private readonly shared: BookingSharedService,
    private readonly bookingStatePolicy: BookingStatePolicy,
    private readonly bookingCommissionService: BookingCommissionService,
  ) {}

  async arriveAtLocation(providerId: number, bookingId: number) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.ACCEPTED,
    });

    if (booking.providerArrivedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Bạn đã xác nhận đến nơi trước đó',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { providerArrivedAt: new Date() },
    });

    await this.shared.addStatusHistory(
      bookingId,
      'ACCEPTED',
      'ACCEPTED',
      providerId,
      'Đã đến nơi',
    );
    await this.shared.notify(
      booking.customerId,
      'PROVIDER_ARRIVED',
      'Thợ đã đến',
      `Đơn #${booking.bookingCode}: Thợ đã đến địa điểm của bạn`,
      bookingId,
    );

    return { data: updated, message: 'Đã báo đến nơi thành công' };
  }

  async startWork(providerId: number, bookingId: number) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.CONFIRMED,
    });

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.IN_PROGRESS,
    );
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
    });

    await this.shared.addStatusHistory(
      bookingId,
      'CONFIRMED',
      'IN_PROGRESS',
      providerId,
      'Bắt đầu thực hiện',
    );
    await this.shared.notify(
      booking.customerId,
      'WORK_STARTED',
      'Đã bắt đầu thực hiện',
      `Đơn #${booking.bookingCode}: Nhà cung cấp đang thực hiện`,
      bookingId,
    );

    return { data: updated, message: 'Đã bắt đầu thực hiện' };
  }

  async completeWork(
    providerId: number,
    bookingId: number,
    files?: Express.Multer.File[],
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.IN_PROGRESS,
    });

    if (!files || files.length === 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng upload ít nhất 1 ảnh kết quả',
      });
    }

    const now = new Date();

    const uploadedFiles = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadFile(file.buffer, 'bookings'),
      ),
    );

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.DONE,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.DONE,
          completedAt: now,
          autoCompletedAt: null,
        },
      });

      if (uploadedFiles.length > 0) {
        await tx.bookingAttachment.createMany({
          data: uploadedFiles.map((uploaded) => ({
            bookingId,
            type: 'RESULT',
            fileUrl: uploaded.url,
          })),
        });
      }
      return b;
    });

    await this.shared.addStatusHistory(
      bookingId,
      'IN_PROGRESS',
      'DONE',
      providerId,
      'Nhà cung cấp báo hoàn thành',
    );
    await this.shared.notify(
      booking.customerId,
      'WORK_COMPLETED',
      'Công việc đã hoàn thành',
      `Đơn #${booking.bookingCode}: Vui lòng kiểm tra và nghiệm thu trong 24h`,
      bookingId,
    );

    return { data: updated, message: 'Đã báo hoàn thành' };
  }

  async customerAccept(customerId: number, bookingId: number) {
    const booking = await this.shared.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.DONE,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`;

      const currentBooking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (currentBooking?.status !== BookingStatus.DONE) {
        throw new BadRequestException({
          code: ErrorCodes.BOOKING_INVALID_STATE,
          message: 'Đơn hàng đã được nghiệm thu hoặc thay đổi trạng thái',
        });
      }

      await this.bookingCommissionService.deductCommission(
        bookingId,
        customerId,
        tx,
      );

      await tx.booking.update({
        where: { id: bookingId },
        data: { autoCompletedAt: new Date() },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: 'DONE',
          toStatus: 'DONE',
          changedBy: customerId,
          note: 'Khách hàng nghiệm thu',
        },
      });

      return { message: 'Đã nghiệm thu thành công' };
    });

    await this.shared.notify(
      booking.providerId,
      'BOOKING_ACCEPTED',
      'Đơn hàng được nghiệm thu',
      `Đơn #${booking.bookingCode}: Đã hoàn thành`,
      bookingId,
    );

    return result;
  }
}
