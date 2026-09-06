import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { RedisService } from '../../shared/redis/redis.service';
import { FeaturedListingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { paginationMeta } from '../../common/dto/pagination.dto';
import { AdminFeaturedListingsQueryDto } from './dto/services.dto';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class FeaturedListingsService {
  private readonly logger = new Logger('FeaturedListingsService');

  // Giá mặc định 50.000đ/ngày, có thể override bằng system_settings
  private readonly DEFAULT_DAILY_RATE = 50000;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Xóa cache của danh sách dịch vụ nổi bật khi có thay đổi.
   */
  @OnEvent('cache.clear.services')
  private async clearFeaturedCache() {
    try {
      await this.redisService.del('services:featured:8');
      await this.redisService.del('services:featured:4');
      await this.redisService.del('services:featured:10');
      await this.redisService.del('services:featured:20');
      this.logger.log('Cleared featured listings Redis cache');
    } catch (err) {
      this.logger.warn(
        `Failed to clear featured cache: ${this.errorMessage(err)}`,
      );
    }
  }

  /**
   * NCC mua featured listing cho dịch vụ.
   * Trừ tiền từ ví NCC qua prisma.$transaction.
   */
  async purchaseFeaturedListing(
    providerId: number,
    serviceId: number,
    days: number,
  ) {
    // Validate days
    if (![1, 3, 7].includes(days)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Chỉ hỗ trợ gói 1, 3, hoặc 7 ngày',
      });
    }

    // Kiểm tra service thuộc về provider + ACTIVE
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, providerId, isDeleted: false },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại hoặc bạn không có quyền',
      });
    }
    if (service.status !== 'ACTIVE') {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Chỉ có thể đẩy Top dịch vụ đang hoạt động',
      });
    }

    // Kiểm tra đã có featured đang ACTIVE chưa
    const existingFeatured = await this.prisma.featuredListing.findFirst({
      where: {
        serviceId,
        status: FeaturedListingStatus.ACTIVE,
        endDate: { gt: new Date() },
      },
    });
    if (existingFeatured) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Dịch vụ này đang được đẩy Top. Vui lòng đợi hết hạn.',
      });
    }

    // Lấy giá từ system_settings, fallback về default
    const dailyRate = await this.getDailyRate();
    const totalCost = dailyRate * days;

    // Kiểm tra ví NCC
    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Ví không tồn tại. Vui lòng liên hệ quản trị viên.',
      });
    }
    if (wallet.isRestricted) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Ví đang bị hạn chế, không thể mua đẩy Top',
      });
    }
    if (Number(wallet.balance) < totalCost) {
      throw new BadRequestException({
        code: ErrorCodes.WALLET_INSUFFICIENT,
        message: `Số dư không đủ. Cần ${totalCost.toLocaleString('vi-VN')}đ, hiện có ${Number(wallet.balance).toLocaleString('vi-VN')}đ`,
      });
    }

    // Transaction: trừ ví + tạo wallet_transaction + tạo featured_listing + audit log
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      // Trừ tiền ví
      await tx.providerWallet.update({
        where: { providerId },
        data: {
          balance: { decrement: totalCost },
        },
      });

      // Tạo giao dịch ví
      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'FEATURED_FEE',
          amount: -totalCost,
          status: 'SUCCESS',
        },
      });

      // Tạo featured listing
      const featured = await tx.featuredListing.create({
        data: {
          serviceId,
          providerId,
          startDate: now,
          endDate,
          dailyRate,
          totalCost,
          status: FeaturedListingStatus.ACTIVE,
        },
        include: {
          service: {
            select: { id: true, name: true },
          },
        },
      });

      // Tạo audit log
      await tx.auditLog.create({
        data: {
          actorId: providerId,
          action: 'PURCHASE_FEATURED',
          targetType: 'WALLET',
          targetId: txn.id,
          description: `Thanh toán phí đẩy Top dịch vụ #${serviceId} trong ${days} ngày. Phí: ${totalCost.toLocaleString('vi-VN')}đ`,
          ipAddress: 'System',
        },
      });

      return featured;
    });

    // Xóa cache danh sách dịch vụ nổi bật
    await this.clearFeaturedCache();

    this.logger.log(
      `Provider #${providerId} purchased featured listing for service #${serviceId} (${days} days, ${totalCost}đ)`,
    );

    return {
      data: result,
      message: `Đã đẩy dịch vụ lên Top trong ${days} ngày`,
    };
  }

  /**
   * Lấy danh sách dịch vụ featured đang active (cho trang chủ / search).
   * Luôn filter endDate > now() để đảm bảo chính xác dù cron chưa chạy.
   * Áp dụng Redis Caching để tối ưu hóa hiệu năng.
   */
  async getActiveFeatured(limit: number = 8) {
    const cacheKey = `services:featured:${limit}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        return this.isFeaturedResponse(parsed) ? parsed : { data: [] };
      }
    } catch (err) {
      this.logger.warn(
        `Failed to read featured listings from Redis: ${this.errorMessage(err)}`,
      );
    }

    const featured = await this.prisma.featuredListing.findMany({
      where: {
        status: FeaturedListingStatus.ACTIVE,
        endDate: { gt: new Date() },
        service: {
          status: ServiceStatus.ACTIVE,
          isDeleted: false,
          provider: {
            status: 'ACTIVE',
          },
        },
      },
      include: {
        service: {
          include: {
            category: { select: { id: true, name: true } },
            provider: { select: { id: true, fullName: true, avatarUrl: true } },
            images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Dịch vụ đã được lọc qua query Prisma, chỉ cần map
    const activeServices = featured.map((f) => ({
      ...f.service,
      isFeatured: true,
      featuredUntil: f.endDate,
    }));

    const result = { data: activeServices };

    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), 600); // Cache TTL: 10 mins
    } catch (err) {
      this.logger.warn(
        `Failed to write featured listings to Redis: ${this.errorMessage(err)}`,
      );
    }

    return result;
  }

  /**
   * Lấy danh sách featured listing của provider (quản lý)
   */
  async getMyFeaturedListings(providerId: number) {
    const listings = await this.prisma.featuredListing.findMany({
      where: { providerId },
      include: {
        service: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: listings };
  }

  async adminListFeaturedListings(query: AdminFeaturedListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.FeaturedListingWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.providerId) where.providerId = query.providerId;

    const [data, total] = await Promise.all([
      this.prisma.featuredListing.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, status: true } },
          provider: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.featuredListing.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, page, limit) };
  }

  async adminCancelFeaturedListing(adminId: number, id: number) {
    const listing = await this.prisma.featuredListing.findUnique({
      where: { id },
      select: {
        id: true,
        serviceId: true,
        status: true,
        service: { select: { name: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Featured listing không tồn tại',
      });
    }
    if (listing.status !== FeaturedListingStatus.ACTIVE) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Chỉ có thể hủy featured listing đang hoạt động',
      });
    }

    const data = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.featuredListing.update({
        where: { id },
        data: { status: FeaturedListingStatus.CANCELLED },
        include: {
          service: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CANCEL_FEATURED_LISTING',
          targetType: 'FEATURED_LISTING',
          targetId: id,
          description: `Hủy đẩy Top dịch vụ #${listing.serviceId} (${listing.service.name})`,
          ipAddress: 'System',
        },
      });

      return updated;
    });

    await this.clearFeaturedCache();
    return { data, message: 'Đã hủy đẩy Top dịch vụ' };
  }

  async getFeaturedDailyRate() {
    const dailyRate = await this.getDailyRate();
    return { data: { dailyRate } };
  }

  async updateFeaturedDailyRate(adminId: number, dailyRate: number) {
    const setting = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.systemSetting.upsert({
        where: { key: 'featured_daily_rate' },
        create: { key: 'featured_daily_rate', value: String(dailyRate) },
        update: { value: String(dailyRate) },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE_FEATURED_RATE',
          targetType: 'SYSTEM_SETTING',
          targetId: updated.id,
          description: `Cập nhật giá đẩy Top: ${dailyRate.toLocaleString('vi-VN')}đ/ngày`,
          ipAddress: 'System',
        },
      });

      return updated;
    });

    await this.clearFeaturedCache();
    return {
      data: { dailyRate: Number(setting.value) },
      message: 'Đã cập nhật giá đẩy Top',
    };
  }

  async expireListings() {
    const result = await this.prisma.featuredListing.updateMany({
      where: {
        status: FeaturedListingStatus.ACTIVE,
        endDate: { lte: new Date() },
      },
      data: { status: FeaturedListingStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} featured listing(s)`);
      await this.clearFeaturedCache();
    }
  }

  /**
   * Lấy giá featured từ system_settings, fallback về DEFAULT_DAILY_RATE
   */
  private async getDailyRate(): Promise<number> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'featured_daily_rate' },
    });
    return setting ? Number(setting.value) : this.DEFAULT_DAILY_RATE;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isFeaturedResponse(value: unknown): value is { data: unknown[] } {
    return (
      value !== null &&
      typeof value === 'object' &&
      'data' in value &&
      Array.isArray((value as Record<string, unknown>).data)
    );
  }
}
