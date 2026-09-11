import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateBookingCode } from '../../common/utils/generate.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { RedisService } from '../../shared/redis/redis.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import {
  BookingTimeoutService,
  PROVIDER_ACCEPTANCE_TIMEOUT_MS,
} from './booking-timeout.service';
import {
  CancelBookingDto,
  ConfirmSurveyorDto,
  CreateBookingDto,
  RejectQuoteDto,
  SendQuoteDto,
  SendSupplementaryQuoteDto,
} from './dto/bookings.dto';

@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisService,
    private readonly bookingStatePolicy: BookingStatePolicy,
    private readonly bookingCommissionService: BookingCommissionService,
    private readonly shared: BookingSharedService,
    private readonly bookingTimeoutService: BookingTimeoutService,
  ) {}

  async create(customerId: number, dto: CreateBookingDto) {
    await this.shared.checkActiveUser(customerId);
    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        status: ServiceStatus.ACTIVE,
        isDeleted: false,
        provider: {
          status: 'ACTIVE',
          providerWallet: { isRestricted: false },
        },
      },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.SERVICE_NOT_ACTIVE,
        message: 'Dịch vụ không khả dụng',
      });
    }

    if (service.providerId === customerId) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Bạn không thể đặt dịch vụ của chính mình',
      });
    }

    const desiredDate = new Date(dto.desiredTime);
    if (isNaN(desiredDate.getTime()) || desiredDate.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Thời gian mong muốn thực hiện dịch vụ phải ở tương lai',
      });
    }

    // Guard: chống đặt trùng cùng dịch vụ trong thời gian ngắn
    const duplicateWindow = new Date(Date.now() - 5 * 60 * 1000); // 5 phút
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        customerId,
        serviceId: dto.serviceId,
        status: { in: [BookingStatus.PENDING, BookingStatus.QUOTED] },
        createdAt: { gte: duplicateWindow },
      },
    });
    if (existingBooking) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `Bạn đã đặt dịch vụ này lúc ${existingBooking.createdAt.toLocaleString('vi-VN')}. Vui lòng chờ thợ phản hồi hoặc hủy đơn cũ trước khi đặt lại.`,
      });
    }

    // Guard: Rate Limit - chống Spam tạo hàng loạt đơn ảo (Tối đa 3 đơn PENDING cùng lúc)
    const pendingCount = await this.prisma.booking.count({
      where: {
        customerId,
        status: BookingStatus.PENDING,
      },
    });

    if (pendingCount >= 3) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message:
          'Bạn đang có quá nhiều đơn chờ xác nhận (tối đa 3 đơn). Vui lòng chờ thợ phản hồi hoặc hủy bớt đơn cũ trước khi đặt thêm.',
      });
    }

    let bookingItemsData: Array<{
      serviceItemId: number;
      name: string;
      unit: string;
      quantity: number;
      priceSnapshot: Prisma.Decimal;
    }> = [];
    if (dto.items && dto.items.length > 0) {
      const itemIds = dto.items.map((it) => it.serviceItemId);
      const serviceItems = await this.prisma.serviceItem.findMany({
        where: {
          id: { in: itemIds },
          serviceId: dto.serviceId,
        },
      });

      if (serviceItems.length !== dto.items.length) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message:
            'Một số hạng mục dịch vụ con không hợp lệ hoặc không thuộc dịch vụ này',
        });
      }

      bookingItemsData = dto.items.map((it) => {
        const matchingItem = serviceItems.find(
          (s) => s.id === it.serviceItemId,
        );
        if (!matchingItem) {
          throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: `Không tìm thấy hạng mục ID ${it.serviceItemId}`,
          });
        }
        return {
          serviceItemId: it.serviceItemId,
          name: matchingItem.name,
          unit: matchingItem.unit,
          quantity: it.quantity,
          priceSnapshot: matchingItem.price,
        };
      });
    }

    const bookingCode = generateBookingCode();
    const providerResponseDeadline = new Date(
      Date.now() + PROVIDER_ACCEPTANCE_TIMEOUT_MS,
    );

    const booking = await this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          bookingCode,
          customerId,
          providerId: service.providerId,
          serviceId: dto.serviceId,
          description: dto.description,
          province: dto.province,
          district: dto.district,
          ward: dto.ward,
          addressDetail: dto.addressDetail,
          desiredTime: new Date(dto.desiredTime),
          status: BookingStatus.PENDING,
          providerResponseDeadline,
        },
      });

      if (bookingItemsData.length > 0) {
        const finalBookingItems = bookingItemsData.map((it) => ({
          bookingId: createdBooking.id,
          serviceItemId: it.serviceItemId,
          name: it.name,
          unit: it.unit,
          quantity: it.quantity,
          priceSnapshot: it.priceSnapshot,
        }));
        await tx.bookingItem.createMany({ data: finalBookingItems });
      }

      return createdBooking;
    });

    await this.shared.addStatusHistory(
      booking.id,
      '',
      'PENDING',
      customerId,
      'Khách hàng tạo đơn',
    );

    await this.shared.linkConversationToBooking(
      booking.id,
      customerId,
      service.providerId,
      service.id,
    );

    await this.shared.notify(
      service.providerId,
      'NEW_BOOKING',
      'Đơn hàng mới',
      `Bạn nhận được đơn hàng mới #${bookingCode}`,
      booking.id,
    );
    this.bookingTimeoutService.scheduleProviderAcceptanceTimeout(booking.id);

    const bookingWithItems = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { bookingItems: true },
    });

    return { data: bookingWithItems, message: 'Đặt dịch vụ thành công' };
  }

  async acceptByProvider(providerId: number, bookingId: number) {
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

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.ACCEPTED,
    );

    if (booking.providerAcceptedAt) {
      return { data: booking, message: 'Đơn hàng đã được nhận trước đó' };
    }

    if (
      booking.providerResponseDeadline &&
      booking.providerResponseDeadline.getTime() <= Date.now()
    ) {
      await this.bookingTimeoutService.expireProviderAcceptance(bookingId);
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Đơn đã quá 1 phút chưa nhận. Khách hàng cần tìm thợ khác.',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        providerAcceptedAt: new Date(),
        status: BookingStatus.ACCEPTED,
      },
    });

    await this.shared.addStatusHistory(
      bookingId,
      booking.status,
      BookingStatus.ACCEPTED,
      providerId,
      'Nhà cung cấp nhận đơn',
    );

    await this.shared.notify(
      booking.customerId,
      'PROVIDER_ACCEPTED_BOOKING',
      'Thợ đã nhận đơn',
      `Đơn #${booking.bookingCode}: Nhà cung cấp đã nhận yêu cầu của bạn`,
      bookingId,
    );

    return { data: updated, message: 'Đã nhận đơn hàng' };
  }

  async declineByProvider(
    providerId: number,
    bookingId: number,
    dto?: CancelBookingDto,
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

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.CANCELLED,
    );

    const reason = dto?.reason || 'Nhà cung cấp từ chối nhận đơn';
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.shared.addStatusHistory(
      bookingId,
      booking.status,
      BookingStatus.CANCELLED,
      providerId,
      reason,
    );

    await this.shared.notify(
      booking.customerId,
      'PROVIDER_DECLINED_BOOKING',
      'Thợ không nhận đơn',
      `Đơn #${booking.bookingCode}: ${reason}. Bạn có thể tìm thợ khác.`,
      bookingId,
    );

    return { data: updated, message: 'Đã từ chối đơn hàng' };
  }

  async confirmSurveyor(
    providerId: number,
    bookingId: number,
    dto: ConfirmSurveyorDto,
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.ACCEPTED,
    });

    if (!booking.providerAcceptedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Vui lòng nhận đơn trước khi xác nhận thợ khảo sát',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        surveyorName: dto.surveyorName,
        surveyorPhone: dto.surveyorPhone,
      },
    });

    await this.shared.notify(
      booking.customerId,
      'SURVEYOR_ASSIGNED',
      'Người khảo sát đã được chỉ định',
      `${dto.surveyorName} (${dto.surveyorPhone}) sẽ đến khảo sát`,
      bookingId,
    );

    return { data: updated, message: 'Đã xác nhận người khảo sát' };
  }

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
    files: Express.Multer.File[],
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

  async rebook(customerId: number, oldBookingId: number) {
    await this.shared.checkActiveUser(customerId);
    const oldBooking = await this.prisma.booking.findFirst({
      where: { id: oldBookingId, customerId },
      include: { bookingItems: true },
    });

    if (!oldBooking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    const pendingCount = await this.prisma.booking.count({
      where: {
        customerId,
        status: BookingStatus.PENDING,
      },
    });

    if (pendingCount >= 3) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message:
          'Bạn đang có quá nhiều đơn chờ xác nhận (tối đa 3 đơn). Vui lòng chờ thợ phản hồi hoặc hủy bớt đơn cũ trước khi đặt thêm.',
      });
    }

    const service = await this.prisma.service.findFirst({
      where: {
        id: oldBooking.serviceId,
        status: ServiceStatus.ACTIVE,
        isDeleted: false,
        provider: {
          status: 'ACTIVE',
          providerWallet: { isRestricted: false },
        },
      },
    });

    if (!service) {
      throw new BadRequestException({
        code: ErrorCodes.SERVICE_NOT_ACTIVE,
        message: 'Dịch vụ này hiện không còn hoạt động, không thể đặt lại',
      });
    }

    const bookingCode = generateBookingCode();
    const providerResponseDeadline = new Date(
      Date.now() + PROVIDER_ACCEPTANCE_TIMEOUT_MS,
    );

    const newBooking = await this.prisma.booking.create({
      data: {
        bookingCode,
        customerId,
        providerId: oldBooking.providerId,
        serviceId: oldBooking.serviceId,
        description: oldBooking.description,
        province: oldBooking.province,
        district: oldBooking.district,
        ward: oldBooking.ward,
        addressDetail: oldBooking.addressDetail,
        desiredTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: BookingStatus.PENDING,
        providerResponseDeadline,
        bookingItems:
          oldBooking.bookingItems && oldBooking.bookingItems.length > 0
            ? {
                create: oldBooking.bookingItems.map((item) => ({
                  serviceItemId: item.serviceItemId,
                  name: item.name,
                  unit: item.unit,
                  quantity: item.quantity,
                  priceSnapshot: item.priceSnapshot,
                })),
              }
            : undefined,
      },
      include: { bookingItems: true },
    });

    await this.shared.addStatusHistory(
      newBooking.id,
      '',
      'PENDING',
      customerId,
      'Khách hàng đặt lại đơn (rebook)',
    );

    await this.shared.linkConversationToBooking(
      newBooking.id,
      customerId,
      oldBooking.providerId,
      oldBooking.serviceId,
    );

    await this.shared.notify(
      service.providerId,
      'NEW_BOOKING',
      'Đơn hàng mới',
      `Bạn nhận được đơn hàng mới #${bookingCode} (đặt lại từ #${oldBooking.bookingCode})`,
      newBooking.id,
    );
    this.bookingTimeoutService.scheduleProviderAcceptanceTimeout(newBooking.id);

    return { data: newBooking, message: 'Đặt lại dịch vụ thành công' };
  }
}
