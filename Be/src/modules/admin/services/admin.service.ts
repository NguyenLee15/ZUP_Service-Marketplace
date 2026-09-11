import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { KycService } from '../../users/kyc.service';
import { BookingDisputeService } from '../../bookings/booking-dispute.service';
import { BookingLifecycleService } from '../../bookings/booking-lifecycle.service';
import { AdminResolveDisputeDto } from '../dto/admin.dto';
import {
  BookingStatus,
  DisputeStatus,
  KycStatus,
  Prisma,
  ServiceStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private kycService: KycService,
    private bookingLifecycleService: BookingLifecycleService,
    private bookingDisputeService: BookingDisputeService,
  ) {}

  // ... (getUsers, lockUser, unlockUser, deleteUser stay as is)

  // ===== KYC =====

  async getKycRequests(status?: string, page: number = 1, limit: number = 20) {
    const where: Prisma.KycProfileWhereInput = {};
    if (this.isKycStatus(status)) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.kycProfile.findMany({
        where,
        include: {
          provider: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.kycProfile.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getKycRequestById(kycId: number) {
    const kyc = await this.prisma.kycProfile.findUnique({
      where: { id: kycId },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!kyc) {
      throw new NotFoundException({
        message: 'Yêu cầu KYC không tồn tại',
      });
    }

    return { data: kyc };
  }

  async reviewKyc(
    adminId: number,
    kycId: number,
    status: 'APPROVE' | 'REJECT',
    reason: string | undefined,
    ip: string,
  ) {
    return this.kycService.reviewKyc(adminId, kycId, status, reason, ip);
  }

  // ===== BOOKINGS =====

  async getBookings(
    status?: string,
    keyword?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: Prisma.BookingWhereInput = {};
    if (this.isBookingStatus(status)) where.status = status;
    if (keyword) {
      where.OR = [
        { bookingCode: { contains: keyword, mode: 'insensitive' } },
        { customer: { fullName: { contains: keyword, mode: 'insensitive' } } },
        { service: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          provider: { select: { id: true, fullName: true, email: true } },
          service: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
          quotations: { where: { status: 'ACCEPTED' } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getBookingDetail(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        provider: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        service: {
          select: {
            id: true,
            name: true,
            referencePrice: true,
            category: { select: { name: true } },
          },
        },
        quotations: {
          where: { status: 'ACCEPTED' },
          include: { quotationItems: true },
        },
        bookingItems: { include: { serviceItem: true } },
        attachments: true,
        statusHistories: { orderBy: { createdAt: 'asc' } },
        review: true,
        dispute: { include: { evidences: true } },
      },
    });

    if (!booking)
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Booking không tồn tại',
      });
    return booking;
  }

  async cancelBooking(adminId: number, id: number, reason: string) {
    return this.bookingLifecycleService.cancelByAdmin(adminId, id, { reason });
  }

  // ===== DISPUTES =====

  async getDisputes(status?: string, page: number = 1, limit: number = 20) {
    const where: Prisma.DisputeWhereInput = {};
    if (this.isDisputeStatus(status)) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: {
            include: {
              customer: { select: { id: true, fullName: true, email: true } },
              provider: { select: { id: true, fullName: true, email: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getDisputeDetail(id: number) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        evidences: true,
        booking: {
          include: {
            customer: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
            provider: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
            service: { select: { id: true, name: true } },
            quotations: { where: { status: 'ACCEPTED' } },
            attachments: true,
            statusHistories: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!dispute)
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Khiếu nại không tồn tại',
      });
    return dispute;
  }

  async resolveDispute(
    adminId: number,
    id: number,
    dto: AdminResolveDisputeDto,
    ip: string,
  ) {
    return this.bookingDisputeService.resolveDispute(adminId, id, dto, ip);
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
    status?: string,
    keyword?: string,
  ) {
    const where: Prisma.UserWhereInput = {};
    if (this.isUserRole(role)) where.role = role;
    if (this.isUserStatus(status)) where.status = status;
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async checkActiveActor(adminId: number) {
    const actor = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, status: true },
    });
    if (!actor || actor.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản người thực hiện đã bị khóa hoặc không hợp lệ',
      });
    }
    return actor;
  }

  async lockUser(adminId: number, id: number, reason: string, ip: string) {
    if (adminId === id) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Không thể tự khóa tài khoản của chính mình',
      });
    }

    const actor = await this.checkActiveActor(adminId);

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });
    if (!targetUser) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    if (targetUser.role === UserRole.ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Nhân viên không có quyền khóa tài khoản Quản trị viên',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { status: UserStatus.LOCKED },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });

      if (user.role === UserRole.PROVIDER) {
        await tx.service.updateMany({
          where: { providerId: id, status: ServiceStatus.ACTIVE },
          data: { status: ServiceStatus.HIDDEN },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'LOCK_USER',
          targetType: 'USER',
          targetId: id,
          description: reason || 'Bị khóa bởi quản trị viên',
          ipAddress: ip,
        },
      });
    });
  }

  async unlockUser(adminId: number, id: number, ip: string) {
    await this.checkActiveActor(adminId);

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: UserStatus.ACTIVE },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'UNLOCK_USER',
          targetType: 'USER',
          targetId: id,
          description: 'Mở khóa tài khoản',
          ipAddress: ip,
        },
      });
    });
  }

  async deleteUser(adminId: number, id: number, ip: string) {
    if (adminId === id) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Không thể tự xóa tài khoản của chính mình',
      });
    }

    const actor = await this.checkActiveActor(adminId);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    if (user.role === UserRole.ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Không thể xóa tài khoản Quản trị viên',
      });
    }

    const activeBookings = await this.prisma.booking.count({
      where: {
        customerId: id,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.QUOTED,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_STATE,
        message: 'Không thể xóa tài khoản khi còn đơn hàng chưa hoàn thành',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          email: `DELETED_${id}_${user.email}`,
          status: UserStatus.LOCKED,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });

      await tx.service.updateMany({
        where: { providerId: id },
        data: { isDeleted: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'DELETE_USER',
          targetType: 'USER',
          targetId: id,
          description: 'Xóa tài khoản (Soft delete)',
          ipAddress: ip,
        },
      });
    });
  }

  async getCommissionSettings() {
    let setting = await this.prisma.systemSetting.findFirst({
      where: { key: 'commission_rate' },
    });
    if (!setting) {
      setting = await this.prisma.systemSetting.create({
        data: {
          key: 'commission_rate',
          value: JSON.stringify({
            rate: 10,
            minAmount: 10000,
            maxAmount: 500000,
          }),
        },
      });
    }
    return this.parseCommissionSettings(setting.value);
  }

  async updateCommissionSettings(
    adminId: number,
    body: {
      rate: number;
      minAmount: number;
      maxAmount: number;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: 'commission_rate' },
        update: { value: JSON.stringify(body) },
        create: { key: 'commission_rate', value: JSON.stringify(body) },
      });

      await tx.commissionConfig.create({
        data: {
          rate: body.rate,
          reason: `Cập nhật cấu hình: min=${body.minAmount}, max=${body.maxAmount}`,
          configuredBy: adminId,
          effectiveFrom: new Date(),
        },
      });
    });
  }

  private parseCommissionSettings(value: string): {
    rate: number;
    minAmount: number;
    maxAmount: number;
  } {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return { rate: 8.5, minAmount: 50000, maxAmount: 5000000 };
    }
    const record = parsed as Record<string, unknown>;
    return {
      rate: Number(record.rate ?? 8.5),
      minAmount: Number(record.minAmount ?? 50000),
      maxAmount: Number(record.maxAmount ?? 5000000),
    };
  }

  private isKycStatus(value: unknown): value is KycStatus {
    return (
      typeof value === 'string' &&
      Object.values(KycStatus).includes(value as KycStatus)
    );
  }

  private isBookingStatus(value: unknown): value is BookingStatus {
    return (
      typeof value === 'string' &&
      Object.values(BookingStatus).includes(value as BookingStatus)
    );
  }

  private isDisputeStatus(value: unknown): value is DisputeStatus {
    return (
      typeof value === 'string' &&
      Object.values(DisputeStatus).includes(value as DisputeStatus)
    );
  }

  private isUserRole(value: unknown): value is UserRole {
    return (
      typeof value === 'string' &&
      Object.values(UserRole).includes(value as UserRole)
    );
  }

  private isUserStatus(value: unknown): value is UserStatus {
    return (
      typeof value === 'string' &&
      Object.values(UserStatus).includes(value as UserStatus)
    );
  }
}
