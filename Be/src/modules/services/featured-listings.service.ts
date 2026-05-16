import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class FeaturedListingsService {
  private readonly logger = new Logger('FeaturedListingsService');

  // Giá mặc định 50.000đ/ngày, có thể override bằng system_settings
  private readonly DEFAULT_DAILY_RATE = 50000;

  constructor(private prisma: PrismaService) {}

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
        status: 'ACTIVE',
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
    if (Number(wallet.balance) < totalCost) {
      throw new BadRequestException({
        code: ErrorCodes.WALLET_INSUFFICIENT,
        message: `Số dư không đủ. Cần ${totalCost.toLocaleString('vi-VN')}đ, hiện có ${Number(wallet.balance).toLocaleString('vi-VN')}đ`,
      });
    }

    // Transaction: trừ ví + tạo wallet_transaction + tạo featured_listing
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
      await tx.walletTransaction.create({
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
          status: 'ACTIVE',
        },
        include: {
          service: {
            select: { id: true, name: true },
          },
        },
      });

      return featured;
    });

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
   */
  async getActiveFeatured(limit: number = 8) {
    const featured = await this.prisma.featuredListing.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gt: new Date() },
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

    // Chỉ trả về service ACTIVE + chưa bị xóa
    const activeServices = featured
      .filter((f) => f.service.status === 'ACTIVE' && !f.service.isDeleted)
      .map((f) => ({
        ...f.service,
        isFeatured: true,
        featuredUntil: f.endDate,
      }));

    return { data: activeServices };
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

  /**
   * Cron: Hết hạn featured listings mỗi giờ
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireListings() {
    const result = await this.prisma.featuredListing.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} featured listing(s)`);
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
}
