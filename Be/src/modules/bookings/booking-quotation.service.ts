import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import {
  RejectQuoteDto,
  SendQuoteDto,
  SendSupplementaryQuoteDto,
} from './dto/bookings.dto';

@Injectable()
export class BookingQuotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly shared: BookingSharedService,
    private readonly bookingStatePolicy: BookingStatePolicy,
    private readonly bookingCommissionService: BookingCommissionService,
  ) {}

  async sendQuote(
    providerId: number,
    bookingId: number,
    dto: SendQuoteDto,
    files?: Express.Multer.File[],
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: [BookingStatus.PENDING, BookingStatus.ACCEPTED],
    });

    if (!booking.providerAcceptedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Vui lòng nhận đơn trước khi gửi báo giá',
      });
    }

    if (!booking.surveyorName) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng xác nhận người khảo sát trước khi gửi báo giá',
      });
    }

    if (!booking.providerArrivedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Vui lòng xác nhận đã đến nơi trước khi gửi báo giá',
      });
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng cung cấp danh sách hạng mục báo giá chi tiết',
      });
    }

    const items = dto.items;

    const actualPrice = items.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    const commissionRate =
      await this.bookingCommissionService.getCurrentCommissionRate();

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.QUOTED,
    );

    const [quotation, updatedBooking] = await this.prisma.$transaction(
      async (tx) => {
        const createdQuotation = await tx.quotation.create({
          data: {
            bookingId,
            actualPrice: actualPrice,
            commissionRateSnapshot: commissionRate,
            estimatedTime: dto.estimatedTime,
            note: dto.note,
          },
        });

        const quotationItems = items.map((item) => ({
          quotationId: createdQuotation.id,
          name: item.name,
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
        }));

        await tx.quotationItem.createMany({ data: quotationItems });

        const updated = await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.QUOTED },
        });

        return [createdQuotation, updated];
      },
    );

    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'bookings',
        );
        await this.prisma.bookingAttachment.create({
          data: { bookingId, type: 'SURVEY', fileUrl: uploaded.url },
        });
      }
    }

    await this.shared.addStatusHistory(
      bookingId,
      booking.status,
      'QUOTED',
      providerId,
      'Nhà cung cấp gửi báo giá',
    );

    await this.shared.notify(
      booking.customerId,
      'QUOTE_RECEIVED',
      'Bạn nhận được báo giá',
      `Đơn #${booking.bookingCode}: Báo giá ${actualPrice.toLocaleString('vi-VN')}₫`,
      bookingId,
    );

    const quotationWithItems = await this.prisma.quotation.findUnique({
      where: { id: quotation.id },
      include: { quotationItems: true },
    });

    return {
      data: { quotation: quotationWithItems, booking: updatedBooking },
      message: 'Đã gửi báo giá',
    };
  }


  async customerConfirmQuote(customerId: number, bookingId: number) {
    const booking = await this.shared.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.QUOTED,
    });

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.CONFIRMED,
    );
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      await tx.quotation.updateMany({
        where: { bookingId, type: 'ORIGINAL', status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });

      await this.shared.addStatusHistory(
        bookingId,
        'QUOTED',
        'CONFIRMED',
        customerId,
        'Khách hàng đồng ý báo giá',
        tx,
      );

      return updatedBooking;
    });
    await this.shared.notify(
      booking.providerId,
      'QUOTE_CONFIRMED',
      'Báo giá được chấp nhận',
      `Đơn #${booking.bookingCode}: Khách hàng đồng ý báo giá`,
      bookingId,
    );

    return { data: updated, message: 'Đã xác nhận báo giá' };
  }


  async customerRejectQuote(
    customerId: number,
    bookingId: number,
    dto: RejectQuoteDto,
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.QUOTED,
    });

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
        'QUOTED',
        'CANCELLED',
        customerId,
        dto.reason,
        tx,
      );

      return b;
    });

    await this.shared.notify(
      booking.providerId,
      'QUOTE_REJECTED',
      'Báo giá bị từ chối',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã từ chối báo giá' };
  }


  async providerSendSupplementaryQuote(
    providerId: number,
    bookingId: number,
    dto: SendSupplementaryQuoteDto,
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.IN_PROGRESS,
    });

    const existingSupplementaryCount = await this.prisma.quotation.count({
      where: { bookingId, type: 'SUPPLEMENTARY' },
    });

    if (existingSupplementaryCount >= 3) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Đã vượt quá số lần báo giá phát sinh tối đa (3 lần)',
      });
    }

    const pendingSupplementary = await this.prisma.quotation.findFirst({
      where: { bookingId, type: 'SUPPLEMENTARY', status: 'PENDING' },
    });

    if (pendingSupplementary) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vẫn còn báo giá phát sinh đang chờ duyệt',
      });
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng cung cấp danh sách hạng mục phát sinh',
      });
    }

    const actualPrice = dto.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    const originalQuote = await this.prisma.quotation.findFirst({
      where: { bookingId, type: 'ORIGINAL' },
    });

    const commissionRate =
      originalQuote?.commissionRateSnapshot ||
      (await this.bookingCommissionService.getCurrentCommissionRate());

    const createdQuotation = await this.prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          bookingId,
          type: 'SUPPLEMENTARY',
          status: 'PENDING',
          actualPrice,
          commissionRateSnapshot: commissionRate,
          estimatedTime: '',
          note: dto.note,
        },
      });

      const quotationItems = dto.items.map((item) => ({
        quotationId: q.id,
        name: item.name,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
      }));

      await tx.quotationItem.createMany({ data: quotationItems });

      return tx.quotation.findUnique({
        where: { id: q.id },
        include: { quotationItems: true },
      });
    });

    await this.shared.addStatusHistory(
      bookingId,
      BookingStatus.IN_PROGRESS,
      BookingStatus.IN_PROGRESS,
      providerId,
      'Nhà cung cấp gửi báo giá phát sinh',
    );

    await this.shared.notify(
      booking.customerId,
      'SUPPLEMENTARY_QUOTE_RECEIVED',
      'Bạn có báo giá phát sinh mới',
      `Đơn #${booking.bookingCode}: Báo giá phát sinh ${actualPrice.toLocaleString('vi-VN')}₫`,
      bookingId,
    );

    return {
      data: createdQuotation,
      message: 'Đã gửi báo giá phát sinh',
    };
  }


  async customerReplySupplementaryQuote(
    customerId: number,
    bookingId: number,
    quotationId: number,
    isAccepted: boolean,
    reason?: string,
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.IN_PROGRESS,
    });

    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (
      !quotation ||
      quotation.bookingId !== bookingId ||
      quotation.type !== 'SUPPLEMENTARY' ||
      quotation.status !== 'PENDING'
    ) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Báo giá phát sinh không hợp lệ hoặc đã được xử lý',
      });
    }

    const newStatus = isAccepted ? 'ACCEPTED' : 'REJECTED';

    const updated = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: { status: newStatus },
      include: { quotationItems: true },
    });

    await this.shared.addStatusHistory(
      bookingId,
      BookingStatus.IN_PROGRESS,
      BookingStatus.IN_PROGRESS,
      customerId,
      isAccepted
        ? 'Khách hàng đồng ý báo giá phát sinh'
        : `Khách hàng từ chối báo giá phát sinh: ${reason}`,
    );

    await this.shared.notify(
      booking.providerId,
      isAccepted
        ? 'SUPPLEMENTARY_QUOTE_ACCEPTED'
        : 'SUPPLEMENTARY_QUOTE_REJECTED',
      isAccepted
        ? 'Khách hàng đồng ý phát sinh'
        : 'Khách hàng từ chối phát sinh',
      `Đơn #${booking.bookingCode}: Khách hàng đã ${isAccepted ? 'đồng ý' : 'từ chối'} báo giá phát sinh`,
      bookingId,
    );

    return { data: updated, message: 'Đã xử lý báo giá phát sinh' };
  }

}
