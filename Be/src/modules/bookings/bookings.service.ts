import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BookingStatus,
  ServiceStatus,
  DisputeStatus,
  WalletTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { RedisService } from '../../shared/redis/redis.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { Workbook } from 'exceljs';
import PdfPrinter from 'pdfmake/js/Printer';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateBookingCode } from '../../common/utils/generate.util';
import {
  NOTIFICATION_EVENTS,
  NotificationEventPayload,
} from '../../common/events/notification-events';
import {
  CreateBookingDto,
  ConfirmSurveyorDto,
  SendQuoteDto,
  CancelBookingDto,
  RejectQuoteDto,
  DisputeDto,
  ResolveDisputeDto,
} from './dto/bookings.dto';

export interface ProviderDashboardFilters {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  status?: string;
  serviceId?: string | number;
  categoryId?: string | number;
  reportType?: string;
}

type ProviderReportType = 'overview' | 'revenue' | 'status' | 'bookings';

type NormalizedProviderFilters = {
  from?: Date;
  to?: Date;
  groupBy: 'day' | 'week' | 'month';
  status?: BookingStatus;
  serviceId?: number;
  categoryId?: number;
  reportType: ProviderReportType;
};

const PROVIDER_ACCEPTANCE_TIMEOUT_MS = 60 * 1000;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger('BookingsService');

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService,
    private jobsService: JobsService,
  ) {}

  // ===== 1. CREATE BOOKING =====

  async create(customerId: number, dto: CreateBookingDto) {
    await this.checkActiveUser(customerId);
    // Kiểm tra service ACTIVE
    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        status: ServiceStatus.ACTIVE,
        isDeleted: false,
      },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.SERVICE_NOT_ACTIVE,
        message: 'Dịch vụ không khả dụng',
      });
    }

    // Không tự đặt cho chính mình
    if (service.providerId === customerId) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Bạn không thể đặt dịch vụ của chính mình',
      });
    }

    const bookingCode = generateBookingCode();
    const providerResponseDeadline = new Date(
      Date.now() + PROVIDER_ACCEPTANCE_TIMEOUT_MS,
    );

    const booking = await this.prisma.booking.create({
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

    // Status history
    await this.addStatusHistory(
      booking.id,
      '',
      'PENDING',
      customerId,
      'Khách hàng tạo đơn',
    );

    await this.linkConversationToBooking(
      booking.id,
      customerId,
      service.providerId,
      service.id,
    );

    // Notify provider
    await this.notify(
      service.providerId,
      'NEW_BOOKING',
      'Đơn hàng mới',
      `Bạn nhận được đơn hàng mới #${bookingCode}`,
      booking.id,
    );
    this.scheduleProviderAcceptanceTimeout(booking.id);

    return { data: booking, message: 'Đặt dịch vụ thành công' };
  }

  // ===== 2. PROVIDER ACCEPTANCE =====

  async acceptByProvider(providerId: number, bookingId: number) {
    await this.checkActiveUser(providerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, providerId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: `Đơn hàng không ở trạng thái phù hợp (hiện tại: ${booking.status})`,
      });
    }

    if (booking.providerAcceptedAt) {
      return { data: booking, message: 'Đơn hàng đã được nhận trước đó' };
    }

    if (
      booking.providerResponseDeadline &&
      booking.providerResponseDeadline.getTime() <= Date.now()
    ) {
      await this.expireProviderAcceptance(bookingId);
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Đơn đã quá 1 phút chưa nhận. Khách hàng cần tìm thợ khác.',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { providerAcceptedAt: new Date() },
    });

    await this.addStatusHistory(
      bookingId,
      'PENDING',
      'PENDING',
      providerId,
      'Nhà cung cấp nhận đơn',
    );

    await this.notify(
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
    await this.checkActiveUser(providerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, providerId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Chỉ có thể từ chối đơn đang chờ xác nhận',
      });
    }

    const reason = dto?.reason || 'Nhà cung cấp từ chối nhận đơn';
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.addStatusHistory(
      bookingId,
      'PENDING',
      'CANCELLED',
      providerId,
      reason,
    );

    await this.notify(
      booking.customerId,
      'PROVIDER_DECLINED_BOOKING',
      'Thợ không nhận đơn',
      `Đơn #${booking.bookingCode}: ${reason}. Bạn có thể tìm thợ khác.`,
      bookingId,
    );

    return { data: updated, message: 'Đã từ chối đơn hàng' };
  }

  // ===== 3. CONFIRM SURVEYOR (Provider) =====

  async confirmSurveyor(
    providerId: number,
    bookingId: number,
    dto: ConfirmSurveyorDto,
  ) {
    const booking = await this.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.PENDING,
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

    await this.notify(
      booking.customerId,
      'SURVEYOR_ASSIGNED',
      'Người khảo sát đã được chỉ định',
      `${dto.surveyorName} (${dto.surveyorPhone}) sẽ đến khảo sát`,
      bookingId,
    );

    return { data: updated, message: 'Đã xác nhận người khảo sát' };
  }

  // ===== 4. SEND QUOTE (Provider) =====

  async sendQuote(
    providerId: number,
    bookingId: number,
    dto: SendQuoteDto,
    files?: Express.Multer.File[],
  ) {
    const booking = await this.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.PENDING,
    });

    if (!booking.providerAcceptedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Vui lòng nhận đơn trước khi gửi báo giá',
      });
    }

    // Phải có surveyor info
    if (!booking.surveyorName) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng xác nhận người khảo sát trước khi gửi báo giá',
      });
    }

    // Snapshot đúng cấu hình admin hiện tại tại thời điểm gửi báo giá.
    const commissionRate = await this.getCurrentCommissionRate();

    // Transaction: tạo quote + update status
    const [quotation, updatedBooking] = await this.prisma.$transaction([
      this.prisma.quotation.create({
        data: {
          bookingId,
          actualPrice: dto.actualPrice,
          commissionRateSnapshot: commissionRate,
          estimatedTime: dto.estimatedTime,
          note: dto.note,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.QUOTED },
      }),
    ]);

    // Upload ảnh khảo sát
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

    await this.addStatusHistory(
      bookingId,
      'PENDING',
      'QUOTED',
      providerId,
      'Nhà cung cấp gửi báo giá',
    );

    await this.notify(
      booking.customerId,
      'QUOTE_RECEIVED',
      'Bạn nhận được báo giá',
      `Đơn #${booking.bookingCode}: Báo giá ${dto.actualPrice.toLocaleString('vi-VN')}₫`,
      bookingId,
    );

    return {
      data: { quotation, booking: updatedBooking },
      message: 'Đã gửi báo giá',
    };
  }

  // ===== 4. CUSTOMER CONFIRM QUOTE =====

  async customerConfirmQuote(customerId: number, bookingId: number) {
    const booking = await this.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.QUOTED,
    });

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    await this.addStatusHistory(
      bookingId,
      'QUOTED',
      'CONFIRMED',
      customerId,
      'Khách hàng đồng ý báo giá',
    );
    await this.notify(
      booking.providerId,
      'QUOTE_CONFIRMED',
      'Báo giá được chấp nhận',
      `Đơn #${booking.bookingCode}: Khách hàng đồng ý báo giá`,
      bookingId,
    );

    return { data: updated, message: 'Đã xác nhận báo giá' };
  }

  // ===== 5. CUSTOMER REJECT QUOTE =====

  async customerRejectQuote(
    customerId: number,
    bookingId: number,
    dto: RejectQuoteDto,
  ) {
    const booking = await this.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.QUOTED,
    });

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.addStatusHistory(
      bookingId,
      'QUOTED',
      'CANCELLED',
      customerId,
      dto.reason,
    );
    await this.notify(
      booking.providerId,
      'QUOTE_REJECTED',
      'Báo giá bị từ chối',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã từ chối báo giá' };
  }

  // ===== 6. START WORK (Provider) =====

  async startWork(providerId: number, bookingId: number) {
    const booking = await this.checkBooking(bookingId, {
      providerId,
      status: BookingStatus.CONFIRMED,
    });

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
    });

    await this.addStatusHistory(
      bookingId,
      'CONFIRMED',
      'IN_PROGRESS',
      providerId,
      'Bắt đầu thực hiện',
    );
    await this.notify(
      booking.customerId,
      'WORK_STARTED',
      'Đã bắt đầu thực hiện',
      `Đơn #${booking.bookingCode}: Nhà cung cấp đang thực hiện`,
      bookingId,
    );

    return { data: updated, message: 'Đã bắt đầu thực hiện' };
  }

  // ===== 7. COMPLETE WORK (Provider) =====

  async completeWork(
    providerId: number,
    bookingId: number,
    files: Express.Multer.File[],
  ) {
    const booking = await this.checkBooking(bookingId, {
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

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DONE,
        completedAt: now,
        autoCompletedAt: null, // Reset deadline if any, wait for cron or customer
      },
    });

    // Upload ảnh kết quả
    for (const file of files) {
      const uploaded = await this.cloudinaryService.uploadFile(
        file.buffer,
        'bookings',
      );
      await this.prisma.bookingAttachment.create({
        data: { bookingId, type: 'RESULT', fileUrl: uploaded.url },
      });
    }

    await this.addStatusHistory(
      bookingId,
      'IN_PROGRESS',
      'DONE',
      providerId,
      'Nhà cung cấp báo hoàn thành',
    );
    await this.notify(
      booking.customerId,
      'WORK_COMPLETED',
      'Công việc đã hoàn thành',
      `Đơn #${booking.bookingCode}: Vui lòng kiểm tra và nghiệm thu trong 24h`,
      bookingId,
    );

    return { data: updated, message: 'Đã báo hoàn thành' };
  }

  // ===== 8. CUSTOMER ACCEPT =====

  async customerAccept(customerId: number, bookingId: number) {
    const booking = await this.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.DONE,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // DB Lock: Lock row booking để tránh race condition với auto-complete
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

      // Trừ hoa hồng và chốt đơn
      await this.deductCommission(bookingId, tx);

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

    // Emit notification SAU transaction commit — nếu rollback thì không gửi
    this.notify(
      booking.providerId,
      'BOOKING_ACCEPTED',
      'Đơn hàng được nghiệm thu',
      `Đơn #${booking.bookingCode}: Đã hoàn thành`,
      bookingId,
    );

    return result;
  }

  // ===== 9. CUSTOMER DISPUTE =====

  async customerDispute(
    customerId: number,
    bookingId: number,
    dto: DisputeDto,
    files?: Express.Multer.File[],
  ) {
    const booking = await this.checkBooking(bookingId, {
      customerId,
      status: BookingStatus.DONE,
    });

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.DISPUTED },
    });

    // Tạo dispute record
    const dispute = await this.prisma.dispute.create({
      data: {
        bookingId,
        raisedBy: customerId,
        reason: dto.reason,
        status: DisputeStatus.PENDING,
      },
    });

    // Upload evidence
    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'disputes',
        );
        await this.prisma.disputeEvidence.create({
          data: {
            disputeId: dispute.id,
            type: file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE',
            fileUrl: uploaded.url,
            uploadedBy: customerId,
          },
        });
      }
    }

    await this.addStatusHistory(
      bookingId,
      'DONE',
      'DISPUTED',
      customerId,
      dto.reason,
    );

    // Notify admin + provider
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const admin of admins) {
      await this.notify(
        admin.id,
        'NEW_DISPUTE',
        'Khiếu nại mới',
        `Đơn #${booking.bookingCode}: ${dto.reason}`,
        bookingId,
      );
    }
    await this.notify(
      booking.providerId,
      'BOOKING_DISPUTED',
      'Đơn hàng bị khiếu nại',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    // AI Phân loại bất đồng bộ. Inline free mode bỏ qua job này để không block người dùng.
    await this.jobsService.enqueue('analyze_dispute', {
      disputeId: dispute.id,
      reason: dto.reason,
    });

    return { data: { booking: updated, dispute }, message: 'Đã gửi khiếu nại' };
  }

  // ===== 10 & 11. CANCEL =====

  async cancelByProvider(
    providerId: number,
    bookingId: number,
    dto: CancelBookingDto,
  ) {
    await this.checkActiveUser(providerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, providerId },
    });
    if (!booking)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });

    if (
      !(
        [BookingStatus.PENDING, BookingStatus.QUOTED] as BookingStatus[]
      ).includes(booking.status)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý hoặc Đã báo giá',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.addStatusHistory(
      bookingId,
      booking.status,
      'CANCELLED',
      providerId,
      dto.reason,
    );
    await this.notify(
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
    await this.checkActiveUser(customerId);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId },
    });
    if (!booking)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });

    if (
      !(
        [BookingStatus.PENDING, BookingStatus.QUOTED] as BookingStatus[]
      ).includes(booking.status)
    ) {
      // SLA Exception: Allow cancellation if CONFIRMED but No-show flag exists in Redis
      const canCancelFree = await this.redisService.exists(
        `booking:noshow:${bookingId}`,
      );

      if (!(booking.status === BookingStatus.CONFIRMED && canCancelFree)) {
        throw new BadRequestException({
          code: ErrorCodes.BOOKING_INVALID_STATE,
          message: 'Chỉ có thể hủy đơn ở trạng thái Chờ xử lý hoặc Đã báo giá',
        });
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.addStatusHistory(
      bookingId,
      booking.status,
      'CANCELLED',
      customerId,
      dto.reason,
    );
    await this.notify(
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
    await this.checkActiveUser(adminId);
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
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.addStatusHistory(
      bookingId,
      booking.status,
      'CANCELLED',
      adminId,
      `Admin hủy đơn: ${reason}`,
    );

    await this.notify(
      booking.customerId,
      'BOOKING_CANCELLED_BY_ADMIN',
      'Đơn hàng đã được hủy',
      `Đơn #${booking.bookingCode}: ${reason}`,
      bookingId,
    );
    await this.notify(
      booking.providerId,
      'BOOKING_CANCELLED_BY_ADMIN',
      'Đơn hàng đã được hủy',
      `Đơn #${booking.bookingCode}: ${reason}`,
      bookingId,
    );

    return { data: updated, message: 'Đã hủy đơn' };
  }

  // ===== 12. DEDUCT COMMISSION =====

  private async getCurrentCommissionRate() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'commission_rate' },
    });

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as { rate?: unknown };
        const rate = Number(parsed.rate);
        if (Number.isFinite(rate) && rate >= 0) return rate;
      } catch {
        this.logger.warn('Invalid commission_rate system setting JSON');
      }
    }

    const commissionConfig = await this.prisma.commissionConfig.findFirst({
      orderBy: { effectiveFrom: 'desc' },
    });
    if (commissionConfig) return Number(commissionConfig.rate);

    return 8.5;
  }

  private async deductCommission(bookingId: number, txClient?: any) {
    const tx = txClient || this.prisma;

    const quotation = await tx.quotation.findUnique({
      where: { bookingId },
    });
    if (!quotation) return;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return;

    const fee =
      (Number(quotation.actualPrice) *
        Number(quotation.commissionRateSnapshot)) /
      100;

    const executeDeduction = async (dbTx: any) => {
      // Trừ ví
      const wallet = await dbTx.providerWallet.update({
        where: { providerId: booking.providerId },
        data: { balance: { decrement: fee } },
      });

      // Tạo transaction record
      await dbTx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'COMMISSION',
          amount: -fee,
          bookingId,
          status: 'SUCCESS',
        },
      });

      // Nếu âm → restricted
      if (Number(wallet.balance) < 0 && !wallet.isRestricted) {
        await dbTx.providerWallet.update({
          where: { id: wallet.id },
          data: { isRestricted: true },
        });
      }
    };

    if (txClient) {
      await executeDeduction(txClient);
    } else {
      await this.prisma.$transaction(executeDeduction);
    }
  }

  // ===== 13. ADMIN RESOLVE DISPUTE =====

  async resolveDispute(
    adminId: number,
    disputeId: number,
    dto: ResolveDisputeDto,
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Khiếu nại không tồn tại',
      });
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Khiếu nại đã được giải quyết',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // Update dispute
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolutionAction: dto.resolutionAction,
          resolutionReason: dto.resolutionReason,
          assignedTo: adminId,
        },
      });

      if (dto.resolutionAction === 'COMPLETE') {
        await this.deductCommission(dispute.bookingId, tx);
      } else if (dto.resolutionAction === 'PENALIZE' && dto.penaltyAmount) {
        // Phạt NCC
        const wallet = await tx.providerWallet.findUnique({
          where: { providerId: dispute.booking.providerId },
        });

        if (wallet) {
          const updatedWallet = await tx.providerWallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: dto.penaltyAmount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: -dto.penaltyAmount,
              type: WalletTransactionType.PENALTY,
              status: 'SUCCESS',
              bookingId: dispute.bookingId,
              disputeId: dispute.id,
            },
          });

          if (
            Number(updatedWallet.balance) < 0 &&
            !updatedWallet.isRestricted
          ) {
            await tx.providerWallet.update({
              where: { id: updatedWallet.id },
              data: { isRestricted: true },
            });
          }
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `RESOLVE_DISPUTE_${dto.resolutionAction}`,
          targetType: 'DISPUTE',
          targetId: disputeId,
          description: dto.resolutionReason,
          ipAddress: ipAddress || null,
        },
      });

      // Status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: dispute.bookingId,
          fromStatus: 'DISPUTED',
          toStatus: 'DISPUTED',
          changedBy: adminId,
          note: dto.resolutionReason,
        },
      });
    });

    // Notify both parties
    const booking = dispute.booking;
    await this.notify(
      booking.customerId,
      'DISPUTE_RESOLVED',
      'Khiếu nại đã được giải quyết',
      `Đơn #${booking.bookingCode}: ${dto.resolutionReason}`,
      booking.id,
    );
    await this.notify(
      booking.providerId,
      'DISPUTE_RESOLVED',
      'Khiếu nại đã được giải quyết',
      `Đơn #${booking.bookingCode}: ${dto.resolutionReason}`,
      booking.id,
    );

    return { message: 'Đã giải quyết tranh chấp' };
  }

  // ===== DASHBOARD STATS & EXPORT (Provider) =====

  async getProviderStats(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const where = this.buildProviderDashboardWhere(providerId, normalized);

    const [statusCounts, quotations, avgRating] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.quotation.findMany({
        where: { booking: { ...where, status: BookingStatus.DONE } },
        select: {
          actualPrice: true,
          commissionRateSnapshot: true,
          booking: { select: { createdAt: true } },
        },
        orderBy: { booking: { createdAt: 'asc' } },
      }),
      this.prisma.review.aggregate({
        where: {
          service: {
            providerId,
            ...(normalized.categoryId
              ? { categoryId: normalized.categoryId }
              : {}),
            ...(normalized.serviceId ? { id: normalized.serviceId } : {}),
          },
        },
        _avg: { rating: true },
      }),
    ]);

    const statsMap = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalBookings = statusCounts.reduce(
      (acc, curr) => acc + curr._count.id,
      0,
    );
    const totalRevenue = quotations.reduce(
      (sum, item) => sum + Number(item.actualPrice),
      0,
    );
    const commissionPaid = quotations.reduce(
      (sum, item) =>
        sum +
        (Number(item.actualPrice) * Number(item.commissionRateSnapshot)) / 100,
      0,
    );
    const revenueData = this.groupProviderRevenue(
      quotations,
      normalized.groupBy,
    );
    const cancelledCount = statsMap[BookingStatus.CANCELLED] || 0;

    return {
      totalBookings,
      pendingBookings: statsMap[BookingStatus.PENDING] || 0,
      pendingCount: statsMap[BookingStatus.PENDING] || 0,
      activeBookings:
        (statsMap[BookingStatus.QUOTED] || 0) +
        (statsMap[BookingStatus.CONFIRMED] || 0) +
        (statsMap[BookingStatus.IN_PROGRESS] || 0),
      inProgressCount:
        (statsMap[BookingStatus.QUOTED] || 0) +
        (statsMap[BookingStatus.CONFIRMED] || 0) +
        (statsMap[BookingStatus.IN_PROGRESS] || 0),
      doneBookings: statsMap[BookingStatus.DONE] || 0,
      doneCount: statsMap[BookingStatus.DONE] || 0,
      cancelledBookings: cancelledCount,
      totalRevenue,
      commissionPaid,
      avgRating: avgRating._avg.rating || 0,
      cancelRate: totalBookings ? (cancelledCount / totalBookings) * 100 : 0,
      revenueData,
      statusData: Object.values(BookingStatus).map((status) => ({
        status,
        count: statsMap[status] || 0,
      })),
      filterSummary: this.describeProviderDashboardFilters(normalized),
      reportType: normalized.reportType,
    };
  }

  async exportProviderPdf(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const stats = await this.getProviderStats(providerId, filters);
    const rows = await this.getProviderReportRows(providerId, filters);

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const printer = new PdfPrinter(fonts);
    const content: any[] = [
      {
        text: 'HomeService Marketplace',
        fontSize: 18,
        bold: true,
      },
      {
        text: this.providerReportTitle(normalized.reportType),
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      {
        text: `Ngay xuat: ${new Date().toLocaleString('vi-VN')}`,
        margin: [0, 0, 0, 4],
      },
      {
        text: `Dieu kien loc: ${stats.filterSummary}`,
        margin: [0, 0, 0, 16],
      },
    ];

    if (normalized.reportType === 'overview') {
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            ['Chi so', 'Gia tri'],
            ['Tong don hang', stats.totalBookings],
            ['Doanh thu', `${stats.totalRevenue.toLocaleString('vi-VN')} VND`],
            [
              'Hoa hong da tru',
              `${stats.commissionPaid.toLocaleString('vi-VN')} VND`,
            ],
            ['Hoan thanh', stats.doneBookings],
            ['Da huy', stats.cancelledBookings],
            ['Danh gia trung binh', Number(stats.avgRating).toFixed(1)],
            ['Ty le huy', `${stats.cancelRate.toFixed(1)}%`],
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    if (['overview', 'revenue'].includes(normalized.reportType)) {
      content.push(
        { text: 'Doanh thu theo ky', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              ['Ky', 'Doanh thu'],
              ...(stats.revenueData.length
                ? stats.revenueData.map((item) => [
                    item.period,
                    `${Number(item.revenue).toLocaleString('vi-VN')} VND`,
                  ])
                : [['-', '0 VND']]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    if (['overview', 'status'].includes(normalized.reportType)) {
      content.push(
        { text: 'Trang thai don hang', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              ['Trang thai', 'So don'],
              ...stats.statusData.map((item) => [item.status, item.count]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    if (['overview', 'bookings'].includes(normalized.reportType)) {
      content.push(
        { text: 'Don hang trong bao cao', bold: true, margin: [0, 18, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              ['Ma don', 'Dich vu', 'Trang thai', 'Gia tri'],
              ...(rows.length
                ? rows.map((booking) => [
                    booking.bookingCode,
                    booking.service?.name || '-',
                    booking.status,
                    booking.quotation?.actualPrice
                      ? `${Number(booking.quotation.actualPrice).toLocaleString('vi-VN')} VND`
                      : '-',
                  ])
                : [['-', 'Chua co du lieu', '-', '-']]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    content.push({
      columns: [
        { text: 'Nha cung cap', alignment: 'center' },
        { text: 'Nguoi xac nhan', alignment: 'center' },
      ],
      margin: [0, 32, 0, 0],
    });

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [36, 42, 36, 48],
      defaultStyle: { font: 'Helvetica' },
      content,
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  async exportProviderExcel(
    providerId: number,
    filters: ProviderDashboardFilters = {},
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    const stats = await this.getProviderStats(providerId, filters);
    const rows = await this.getProviderReportRows(providerId, filters);
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Tong quan');

    worksheet.columns = [
      { header: 'Chi so', key: 'metric', width: 30 },
      { header: 'Gia tri', key: 'value', width: 25 },
    ];

    worksheet.addRows([
      {
        metric: 'Loai bao cao',
        value: this.providerReportTitle(normalized.reportType),
      },
      { metric: 'Dieu kien loc', value: stats.filterSummary },
      { metric: 'Tong don hang', value: stats.totalBookings },
      { metric: 'Doanh thu', value: stats.totalRevenue },
      { metric: 'Hoa hong da tru', value: stats.commissionPaid },
      { metric: 'Hoan thanh', value: stats.doneBookings },
      { metric: 'Da huy', value: stats.cancelledBookings },
      { metric: 'Ty le huy', value: stats.cancelRate },
      { metric: 'Generated At', value: new Date().toLocaleString('vi-VN') },
    ]);

    if (['overview', 'revenue'].includes(normalized.reportType)) {
      const revenueSheet = workbook.addWorksheet('Doanh thu');
      revenueSheet.columns = [
        { header: 'Ky', key: 'period', width: 20 },
        { header: 'Doanh thu', key: 'revenue', width: 20 },
      ];
      revenueSheet.addRows(stats.revenueData);
    }

    if (['overview', 'status'].includes(normalized.reportType)) {
      const statusSheet = workbook.addWorksheet('Trang thai');
      statusSheet.columns = [
        { header: 'Trang thai', key: 'status', width: 22 },
        { header: 'So don', key: 'count', width: 12 },
      ];
      statusSheet.addRows(stats.statusData);
    }

    if (['overview', 'bookings'].includes(normalized.reportType)) {
      const bookingSheet = workbook.addWorksheet('Don hang');
      bookingSheet.columns = [
        { header: 'Ma don', key: 'code', width: 18 },
        { header: 'Dich vu', key: 'service', width: 32 },
        { header: 'Khach hang', key: 'customer', width: 28 },
        { header: 'Trang thai', key: 'status', width: 18 },
        { header: 'Gia tri', key: 'value', width: 18 },
        { header: 'Ngay tao', key: 'createdAt', width: 22 },
      ];
      bookingSheet.addRows(
        rows.map((booking) => ({
          code: booking.bookingCode,
          service: booking.service?.name,
          customer: booking.customer?.fullName,
          status: booking.status,
          value: booking.quotation?.actualPrice
            ? Number(booking.quotation.actualPrice)
            : 0,
          createdAt: booking.createdAt.toLocaleString('vi-VN'),
        })),
      );
    }

    for (const sheet of workbook.worksheets) {
      sheet.getRow(1).font = { bold: true };
    }
    return workbook;
  }

  private async getProviderReportRows(
    providerId: number,
    filters: ProviderDashboardFilters,
  ) {
    const normalized = this.normalizeProviderDashboardFilters(filters);
    return this.prisma.booking.findMany({
      where: this.buildProviderDashboardWhere(providerId, normalized),
      include: {
        service: { select: { id: true, name: true } },
        customer: { select: { id: true, fullName: true } },
        quotation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  private normalizeProviderDashboardFilters(
    filters: ProviderDashboardFilters,
  ): NormalizedProviderFilters {
    return {
      from: this.parseDashboardDate(filters.from, 'from'),
      to: this.parseDashboardDate(filters.to, 'to'),
      groupBy: this.parseDashboardGroupBy(filters.groupBy),
      status: this.parseDashboardStatus(filters.status),
      serviceId: this.parseDashboardNumber(filters.serviceId),
      categoryId: this.parseDashboardNumber(filters.categoryId),
      reportType: this.parseProviderReportType(filters.reportType),
    };
  }

  private buildProviderDashboardWhere(
    providerId: number,
    filters: NormalizedProviderFilters,
  ): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = { providerId };
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }
    if (filters.status) where.status = filters.status;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.categoryId) where.service = { categoryId: filters.categoryId };
    return where;
  }

  private groupProviderRevenue(
    quotations: Array<{
      actualPrice: unknown;
      booking: { createdAt: Date };
    }>,
    groupBy: 'day' | 'week' | 'month',
  ) {
    const grouped = new Map<string, number>();
    for (const quotation of quotations) {
      const period = this.dashboardPeriodLabel(
        quotation.booking.createdAt,
        groupBy,
      );
      grouped.set(
        period,
        (grouped.get(period) || 0) + Number(quotation.actualPrice),
      );
    }
    return Array.from(grouped.entries()).map(([period, revenue]) => ({
      period,
      revenue,
    }));
  }

  private parseDashboardDate(value: string | undefined, edge: 'from' | 'to') {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (edge === 'to' && value.length <= 10) date.setHours(23, 59, 59, 999);
    return date;
  }

  private parseDashboardNumber(value: string | number | undefined) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private parseDashboardStatus(value: string | undefined) {
    if (!value) return undefined;
    return Object.values(BookingStatus).includes(value as BookingStatus)
      ? (value as BookingStatus)
      : undefined;
  }

  private parseDashboardGroupBy(
    value: ProviderDashboardFilters['groupBy'] | undefined,
  ) {
    return ['day', 'week', 'month'].includes(value as string)
      ? (value as 'day' | 'week' | 'month')
      : 'month';
  }

  private parseProviderReportType(
    value: string | undefined,
  ): ProviderReportType {
    const allowed: ProviderReportType[] = [
      'overview',
      'revenue',
      'status',
      'bookings',
    ];
    return allowed.includes(value as ProviderReportType)
      ? (value as ProviderReportType)
      : 'overview';
  }

  private providerReportTitle(type: ProviderReportType) {
    const labels: Record<ProviderReportType, string> = {
      overview: 'Bao cao tong quan',
      revenue: 'Bao cao doanh thu',
      status: 'Bao cao trang thai don',
      bookings: 'Bao cao danh sach don',
    };
    return labels[type];
  }

  private dashboardPeriodLabel(date: Date, groupBy: 'day' | 'week' | 'month') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (groupBy === 'day') return `${day}/${month}`;
    if (groupBy === 'week') {
      const first = new Date(year, 0, 1);
      const pastDays = (date.getTime() - first.getTime()) / 86400000;
      return `${year}-W${String(Math.ceil((pastDays + first.getDay() + 1) / 7)).padStart(2, '0')}`;
    }
    return `${month}/${year}`;
  }

  private describeProviderDashboardFilters(filters: NormalizedProviderFilters) {
    const parts = [
      `loai ${this.providerReportTitle(filters.reportType).toLowerCase()}`,
      filters.from ? `tu ${filters.from.toISOString().slice(0, 10)}` : '',
      filters.to ? `den ${filters.to.toISOString().slice(0, 10)}` : '',
      filters.status ? `trang thai ${filters.status}` : '',
      filters.categoryId ? `danh muc #${filters.categoryId}` : '',
      filters.serviceId ? `dich vu #${filters.serviceId}` : '',
      `nhom theo ${filters.groupBy}`,
    ].filter(Boolean);
    return parts.join(', ') || 'tat ca du lieu';
  }

  // ===== 14. REBOOK (Customer) =====

  async rebook(customerId: number, oldBookingId: number) {
    await this.checkActiveUser(customerId);
    const oldBooking = await this.prisma.booking.findFirst({
      where: { id: oldBookingId, customerId },
    });

    if (!oldBooking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    const service = await this.prisma.service.findFirst({
      where: {
        id: oldBooking.serviceId,
        status: ServiceStatus.ACTIVE,
        isDeleted: false,
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
        // Yêu cầu thời gian là thời điểm hiện tại + 1 ngày (mặc định)
        desiredTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: BookingStatus.PENDING,
        providerResponseDeadline,
      },
    });

    await this.addStatusHistory(
      newBooking.id,
      '',
      'PENDING',
      customerId,
      'Khách hàng đặt lại đơn (rebook)',
    );

    await this.linkConversationToBooking(
      newBooking.id,
      customerId,
      oldBooking.providerId,
      oldBooking.serviceId,
    );

    await this.notify(
      service.providerId,
      'NEW_BOOKING',
      'Đơn hàng mới',
      `Bạn nhận được đơn hàng mới #${bookingCode} (đặt lại từ #${oldBooking.bookingCode})`,
      newBooking.id,
    );
    this.scheduleProviderAcceptanceTimeout(newBooking.id);

    return { data: newBooking, message: 'Đặt lại dịch vụ thành công' };
  }

  // ===== QUERIES =====

  async getById(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { providerId: userId }],
      },
      include: {
        service: {
          include: { images: { take: 1, orderBy: { displayOrder: 'asc' } } },
        },
        customer: {
          select: { id: true, fullName: true, avatarUrl: true, phone: true },
        },
        provider: {
          select: { id: true, fullName: true, avatarUrl: true, phone: true },
        },
        quotation: true,
        attachments: true,
        statusHistories: { orderBy: { id: 'asc' } },
        dispute: { include: { evidences: true } },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }

    return { data: booking };
  }

  async getMyBookings(
    userId: number,
    role: 'customer' | 'provider',
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any =
      role === 'customer' ? { customerId: userId } : { providerId: userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              images: { take: 1, orderBy: { displayOrder: 'asc' } },
            },
          },
          customer: { select: { id: true, fullName: true } },
          provider: { select: { id: true, fullName: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== HELPERS =====

  async expirePendingProviderAcceptances() {
    const now = new Date();
    const overdueBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        providerAcceptedAt: null,
        providerResponseDeadline: { lte: now },
      },
      select: { id: true },
      take: 50,
    });

    let expired = 0;
    for (const booking of overdueBookings) {
      if (await this.expireProviderAcceptance(booking.id)) expired += 1;
    }

    return expired;
  }

  async expireProviderAcceptance(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
        providerId: true,
        status: true,
        providerAcceptedAt: true,
        providerResponseDeadline: true,
      },
    });

    if (
      !booking ||
      booking.status !== BookingStatus.PENDING ||
      booking.providerAcceptedAt
    ) {
      return false;
    }

    const deadline =
      booking.providerResponseDeadline ??
      new Date(Date.now() - PROVIDER_ACCEPTANCE_TIMEOUT_MS);
    if (deadline.getTime() > Date.now()) return false;

    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        status: BookingStatus.PENDING,
        providerAcceptedAt: null,
      },
      data: { status: BookingStatus.CANCELLED },
    });

    if (result.count === 0) return false;

    const note = 'Quá 1 phút nhà cung cấp chưa nhận đơn';
    await this.addStatusHistory(
      bookingId,
      'PENDING',
      'CANCELLED',
      booking.providerId,
      note,
    );

    await this.notify(
      booking.customerId,
      'PROVIDER_ACCEPTANCE_TIMEOUT',
      'Thợ chưa nhận đơn',
      `Đơn #${booking.bookingCode}: Quá 1 phút chưa được nhận. Bạn có thể tìm thợ khác.`,
      bookingId,
    );

    await this.notify(
      booking.providerId,
      'BOOKING_ACCEPTANCE_EXPIRED',
      'Đơn đã quá hạn nhận',
      `Đơn #${booking.bookingCode} đã tự hủy vì quá 1 phút chưa nhận.`,
      bookingId,
    );

    return true;
  }

  private scheduleProviderAcceptanceTimeout(bookingId: number) {
    const timeout = setTimeout(() => {
      void this.expireProviderAcceptance(bookingId).catch((error) => {
        this.logger.warn(
          `Failed to expire booking #${bookingId}: ${error.message}`,
        );
      });
    }, PROVIDER_ACCEPTANCE_TIMEOUT_MS + 1000);

    timeout.unref?.();
  }

  private async linkConversationToBooking(
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
    } catch (error: any) {
      this.logger.warn(
        `Failed to link conversation for booking #${bookingId}: ${error.message}`,
      );
    }
  }

  private async checkActiveUser(userId: number) {
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

  private async checkBooking(
    bookingId: number,
    opts: {
      customerId?: number;
      providerId?: number;
      status: BookingStatus;
      includeService?: boolean;
    },
  ) {
    if (opts.customerId) await this.checkActiveUser(opts.customerId);
    if (opts.providerId) await this.checkActiveUser(opts.providerId);

    const where: any = { id: bookingId };
    if (opts.customerId) where.customerId = opts.customerId;
    if (opts.providerId) where.providerId = opts.providerId;

    const query: any = { where };
    if (opts.includeService) {
      query.include = { service: true };
    }

    const booking = await this.prisma.booking.findFirst(query);
    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Đơn hàng không tồn tại',
      });
    }
    if (booking.status !== opts.status) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: `Đơn hàng không ở trạng thái phù hợp (hiện tại: ${booking.status})`,
      });
    }
    return booking;
  }

  private async addStatusHistory(
    bookingId: number,
    from: string,
    to: string,
    changedBy: number,
    note?: string,
  ) {
    await this.prisma.bookingStatusHistory.create({
      data: { bookingId, fromStatus: from, toStatus: to, changedBy, note },
    });
  }

  // Fire-and-forget: emit event, NotificationListener xử lý persist + WebSocket
  private notify(
    userId: number,
    type: string,
    title: string,
    content: string,
    referenceId: number,
  ) {
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SEND, {
      userId,
      type,
      title,
      content,
      referenceId,
    } as NotificationEventPayload);
  }
}
