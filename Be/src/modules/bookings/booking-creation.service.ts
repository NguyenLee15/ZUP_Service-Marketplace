import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateBookingCode } from '../../common/utils/generate.util';
import { PrismaService } from '../../prisma/prisma.service';
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
} from './dto/bookings.dto';

@Injectable()
export class BookingCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: BookingSharedService,
    private readonly bookingTimeoutService: BookingTimeoutService,
    private readonly bookingStatePolicy: BookingStatePolicy,
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
    dto?: CancelBookingDto | { reason?: string },
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
