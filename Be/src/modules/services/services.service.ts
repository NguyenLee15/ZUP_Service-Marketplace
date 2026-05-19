import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ServiceStatus, KycStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { AiService } from '../../shared/ai/ai.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { RedisService } from '../../shared/redis/redis.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  SearchServiceDto,
} from './dto/services.dto';

type SearchServicesResult = {
  data: any[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class ServicesService {
  private readonly logger = new Logger('ServicesService');
  private readonly searchCache = new Map<
    string,
    { expiresAt: number; result: unknown }
  >();
  private readonly searchCacheTtlMs = 30_000;
  private readonly searchCacheMaxEntries = 100;

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private aiService: AiService,
    private jobsService: JobsService,
    private redisService: RedisService,
  ) {}

  // ===== HELPERS =====
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

  // ===== PROVIDER — CRUD =====

  async create(
    providerId: number,
    dto: CreateServiceDto,
    files?: Express.Multer.File[],
  ) {
    await this.checkActiveUser(providerId);
    // Kiểm tra category tồn tại
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category || category.isDeleted) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Danh mục không tồn tại',
      });
    }

    const service = await this.prisma.service.create({
      data: {
        providerId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        referencePrice: dto.referencePrice,
        status: ServiceStatus.DRAFT,
      },
    });

    // Upload images nếu có
    if (files && files.length > 0) {
      const imagePromises = files.map(async (file, index) => {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'services',
        );
        return {
          serviceId: service.id,
          imageUrl: uploaded.url,
          cloudinaryId: uploaded.publicId,
          displayOrder: index,
        };
      });

      const images = await Promise.all(imagePromises);
      await this.prisma.serviceImage.createMany({ data: images });
    }

    return {
      data: service,
      message: 'Tạo dịch vụ nháp thành công',
    };
  }

  async update(
    providerId: number,
    serviceId: number,
    dto: UpdateServiceDto,
    files?: Express.Multer.File[],
  ) {
    await this.checkActiveUser(providerId);
    const service = await this.checkOwnership(serviceId, providerId);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.referencePrice) updateData.referencePrice = dto.referencePrice;

    // Nếu ACTIVE hoặc REJECTED → về PENDING (cần duyệt lại)
    if (
      service.status === ServiceStatus.ACTIVE ||
      service.status === ServiceStatus.REJECTED
    ) {
      updateData.status = ServiceStatus.PENDING;
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Upload new images nếu có
    if (files && files.length > 0) {
      const currentImages = await this.prisma.serviceImage.count({
        where: { serviceId },
      });

      const imagePromises = files.map(async (file, index) => {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'services',
        );
        return {
          serviceId,
          imageUrl: uploaded.url,
          cloudinaryId: uploaded.publicId,
          displayOrder: currentImages + index,
        };
      });

      const images = await Promise.all(imagePromises);
      await this.prisma.serviceImage.createMany({ data: images });
    }

    // Notify admin nếu chuyển sang PENDING
    if (updateData.status === ServiceStatus.PENDING) {
      await this.notifyAdmins(
        'SERVICE_UPDATED',
        'Dịch vụ cần duyệt lại',
        `Dịch vụ "${updated.name}" đã được cập nhật và cần duyệt lại`,
        serviceId,
      );
    }

    return { data: updated, message: 'Cập nhật dịch vụ thành công' };
  }

  async submit(providerId: number, serviceId: number) {
    const service = await this.checkOwnership(serviceId, providerId);

    if (service.status !== ServiceStatus.DRAFT) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể gửi duyệt dịch vụ ở trạng thái Nháp',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.PENDING },
    });

    await this.notifyAdmins(
      'NEW_SERVICE',
      'Dịch vụ mới cần duyệt',
      `Nhà cung cấp #${providerId} đã gửi dịch vụ "${service.name}" để duyệt`,
      serviceId,
    );

    return { data: updated, message: 'Đã gửi dịch vụ để duyệt' };
  }

  async hide(providerId: number, serviceId: number) {
    const service = await this.checkOwnership(serviceId, providerId);

    if (service.status !== ServiceStatus.ACTIVE) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể ẩn dịch vụ đang hoạt động',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.HIDDEN },
    });

    return { data: updated, message: 'Đã ẩn dịch vụ' };
  }

  async show(providerId: number, serviceId: number) {
    const service = await this.checkOwnership(serviceId, providerId);

    if (service.status !== ServiceStatus.HIDDEN) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể hiện dịch vụ đang ẩn',
      });
    }

    // Kiểm tra ví không bị restricted
    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (wallet?.isRestricted) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Ví của bạn đang bị hạn chế. Vui lòng nạp tiền trước.',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ACTIVE },
    });

    return { data: updated, message: 'Đã hiện dịch vụ' };
  }

  async getMyServices(providerId: number, status?: string) {
    const where: any = { providerId, isDeleted: false };
    if (status) where.status = status;

    const services = await this.prisma.service.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: { id: 'desc' },
    });

    return { data: services };
  }

  async deleteByProvider(providerId: number, serviceId: number) {
    const service = await this.checkOwnership(serviceId, providerId);

    // Chỉ xóa được khi DRAFT hoặc HIDDEN
    if (
      !(
        [ServiceStatus.DRAFT, ServiceStatus.HIDDEN] as ServiceStatus[]
      ).includes(service.status)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể xóa dịch vụ ở trạng thái Nháp hoặc Đã ẩn',
      });
    }

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { isDeleted: true },
    });

    return { message: 'Đã xóa dịch vụ' };
  }

  // ===== ADMIN =====

  async adminApprove(adminId: number, serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          include: { kycProfiles: { orderBy: { id: 'desc' }, take: 1 } },
        },
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });
    }
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Dịch vụ không ở trạng thái chờ duyệt',
      });
    }

    // Kiểm tra KYC đã APPROVED
    const kycStatus = service.provider?.kycProfiles?.[0]?.status;
    if (kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Nhà cung cấp chưa được xác minh KYC',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ACTIVE },
    });

    // Auto-embed khi ACTIVE (inline mode sẽ bỏ qua job AI để tiết kiệm quota)
    await this.jobsService.enqueue('service.generate-embedding', {
      serviceId,
      name: service.name,
      description: service.description,
    });

    // Notify Provider
    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_APPROVED',
        title: 'Dịch vụ đã được duyệt',
        content: `Dịch vụ "${service.name}" đã được phê duyệt và hiển thị công khai`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã phê duyệt dịch vụ' };
  }

  async adminReject(adminId: number, serviceId: number, reason: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Dịch vụ không ở trạng thái chờ duyệt',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.REJECTED },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_REJECTED',
        title: 'Dịch vụ bị từ chối',
        content: `Dịch vụ "${service.name}" bị từ chối. Lý do: ${reason}`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã từ chối dịch vụ' };
  }

  async adminHide(adminId: number, serviceId: number, reason: string = '') {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });
    if (service.status !== ServiceStatus.ACTIVE) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể ẩn dịch vụ đang hoạt động',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.HIDDEN },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_HIDDEN',
        title: 'Dịch vụ bị ẩn bởi Admin',
        content: `Dịch vụ "${service.name}" đã bị ẩn. Lý do: ${reason}`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã ẩn dịch vụ' };
  }

  async deleteByAdmin(adminId: number, serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { isDeleted: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_DELETED',
        title: 'Dịch vụ bị xóa bởi Admin',
        content: `Dịch vụ "${service.name}" đã bị Admin xóa khỏi hệ thống`,
        referenceId: serviceId,
      },
    });

    return { message: 'Đã xóa dịch vụ' };
  }

  async adminGetAll(filters?: {
    status?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = { isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true, email: true } },
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== PUBLIC =====

  private buildSearchCacheKey(
    dto: SearchServiceDto,
    page: number,
    limit: number,
  ) {
    return JSON.stringify({
      categoryId: dto.categoryId ?? null,
      keyword: dto.keyword?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '',
      limit,
      maxPrice: dto.maxPrice ?? null,
      minPrice: dto.minPrice ?? null,
      minRating: dto.minRating ?? null,
      page,
      province: dto.province?.trim().toLowerCase() ?? '',
      sortBy: dto.sortBy ?? 'newest',
    });
  }

  private getCachedSearchResult<T>(cacheKey: string): T | null {
    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    return cached.result as T;
  }

  private setCachedSearchResult(cacheKey: string, result: unknown) {
    const now = Date.now();
    if (this.searchCache.size >= this.searchCacheMaxEntries) {
      for (const [key, value] of this.searchCache) {
        if (
          value.expiresAt <= now ||
          this.searchCache.size > this.searchCacheMaxEntries / 2
        ) {
          this.searchCache.delete(key);
        }
      }
    }

    this.searchCache.set(cacheKey, {
      expiresAt: now + this.searchCacheTtlMs,
      result,
    });
  }

  async search(dto: SearchServiceDto): Promise<SearchServicesResult> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(Math.max(1, dto.limit || 20), 50);
    const cacheKey = this.buildSearchCacheKey(dto, page, limit);
    const cached = this.getCachedSearchResult<SearchServicesResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: any = {
      status: ServiceStatus.ACTIVE,
      isDeleted: false,
    };

    if (dto.keyword) {
      // Tách keyword thành từng từ để match linh hoạt hơn
      // VD: "thông bồn cầu" → match "Thông tắc bồn cầu" (mỗi từ phải xuất hiện trong name hoặc description)
      const words = dto.keyword
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      if (words.length > 1) {
        // Multi-word: AND tất cả các từ, mỗi từ OR(name, description)
        where.AND = words.map((word) => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' as const } },
            { description: { contains: word, mode: 'insensitive' as const } },
          ],
        }));
      } else {
        // Single word: giữ nguyên logic cũ
        where.OR = [
          { name: { contains: dto.keyword, mode: 'insensitive' } },
          { description: { contains: dto.keyword, mode: 'insensitive' } },
        ];
      }
    }

    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.minPrice || dto.maxPrice) {
      where.referencePrice = {};
      if (dto.minPrice) where.referencePrice.gte = dto.minPrice;
      if (dto.maxPrice) where.referencePrice.lte = dto.maxPrice;
    }
    if (dto.minRating) where.avgRating = { gte: dto.minRating };

    const orderBy: any[] = [];
    if (dto.sortBy === 'rating') orderBy.push({ avgRating: 'desc' });
    else if (dto.sortBy === 'price_asc')
      orderBy.push({ referencePrice: 'asc' });
    else if (dto.sortBy === 'price_desc')
      orderBy.push({ referencePrice: 'desc' });
    else orderBy.push({ id: 'desc' });

    // Luôn ưu tiên Featured Listing lên đầu
    orderBy.unshift({ featuredListings: { _count: 'desc' } });

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true, avatarUrl: true } },
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          featuredListings: {
            where: {
              status: 'ACTIVE',
              endDate: { gt: new Date() },
            },
            take: 1,
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    const mappedData = (data as any[]).map((s) => ({
      ...s,
      isFeatured: s.featuredListings?.length > 0,
    }));

    const result = {
      data: mappedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    this.setCachedSearchResult(cacheKey, result);
    return result;
  }

  async aiSearch(query: string) {
    // 1. Kiểm tra Cache trong Redis trước (TTL 24h)
    // Normalize: lowercase, trim, collapse multiple spaces
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `ai_search:${normalizedQuery}`;
    const cachedResult = await this.redisService.get(cacheKey);

    if (cachedResult) {
      this.logger.log(`[AI Caching] Cache hit for query: "${query}"`);
      return { data: JSON.parse(cachedResult) };
    }

    this.logger.log(
      `[AI Caching] Cache miss for query: "${query}". Calling Gemini API...`,
    );

    // 2. Thử semantic search với Google Gemini
    const embedding = await this.aiService.createEmbedding(query);

    if (!embedding) {
      // Fallback: LIKE search
      const fallbackResult = await this.search({
        keyword: query,
        page: 1,
        limit: 10,
      });
      return fallbackResult;
    }

    // 3. pgvector cosine similarity (parameterized query — chống SQL Injection)
    const vectorStr = `[${embedding.join(',')}]`;
    try {
      const services = (await this.prisma.$queryRaw(
        Prisma.sql`
          SELECT s.*, 1 - (s.embedding <=> ${vectorStr}::vector) as similarity
          FROM services s
          WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
          ORDER BY s.embedding <=> ${vectorStr}::vector
          LIMIT 10
        `,
      )) as any[];

      // Lưu kết quả vào Redis Cache (Sống trong 24 giờ = 86400s)
      await this.redisService.set(cacheKey, JSON.stringify(services), 86400);

      return { data: services };
    } catch (error) {
      this.logger.error(`pgvector search failed: ${error.message}`);
      return this.search({ keyword: query, page: 1, limit: 10 });
    }
  }

  async getPublicDetail(serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, status: ServiceStatus.ACTIVE, isDeleted: false },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            createdAt: true,
          },
        },
        images: { orderBy: { displayOrder: 'asc' } },
        reviews: {
          include: {
            customer: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { id: 'desc' },
          take: 10,
        },
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại hoặc đã bị ẩn',
      });
    }

    return { data: service };
  }

  /**
   * Tính toán chỉ số hiệu suất NCC dựa trên dữ liệu booking hiện có.
   * - Thời gian phản hồi TB: AVG(QUOTED.createdAt - booking.createdAt), loại trừ CANCELLED
   * - Tỷ lệ hoàn thành: DONE / (CONFIRMED + IN_PROGRESS + DONE + DISPUTED)
   * - Số đơn hoàn thành: COUNT(DONE)
   */
  async getProviderMetrics(providerId: number) {
    // Lấy tất cả booking của NCC này (loại trừ CANCELLED trước khi báo giá)
    const [responseTimeData, completionData] = await Promise.all([
      // 1. Tính thời gian phản hồi TB: thời điểm chuyển sang QUOTED - thời điểm tạo booking
      this.prisma.$queryRaw<Array<{ avg_response_hours: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (bsh.created_at - b.created_at)) / 3600) as avg_response_hours
        FROM booking_status_histories bsh
        JOIN bookings b ON bsh.booking_id = b.id
        WHERE b.provider_id = ${providerId}
          AND bsh.to_status = 'QUOTED'
          AND bsh.from_status = 'PENDING'
      `,
      // 2. Tính tỷ lệ hoàn thành: DONE / (tổng booking đã CONFIRMED trở lên)
      this.prisma.booking.groupBy({
        by: ['status'],
        where: {
          providerId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'DONE', 'DISPUTED'] },
        },
        _count: true,
      }),
    ]);

    // Parse kết quả
    const avgResponseHours = responseTimeData[0]?.avg_response_hours
      ? Number(responseTimeData[0].avg_response_hours)
      : null;

    const statusCounts = completionData.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalConfirmedPlus =
      (statusCounts['CONFIRMED'] || 0) +
      (statusCounts['IN_PROGRESS'] || 0) +
      (statusCounts['DONE'] || 0) +
      (statusCounts['DISPUTED'] || 0);

    const totalDone = statusCounts['DONE'] || 0;
    const completionRate =
      totalConfirmedPlus > 0
        ? Math.round((totalDone / totalConfirmedPlus) * 100)
        : null;

    return {
      data: {
        avgResponseHours:
          avgResponseHours !== null
            ? Math.round(avgResponseHours * 10) / 10
            : null,
        completionRate,
        totalCompleted: totalDone,
        totalBookings: totalConfirmedPlus,
      },
    };
  }

  // ===== HELPERS =====

  private async checkOwnership(serviceId: number, providerId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, providerId, isDeleted: false },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại hoặc bạn không có quyền',
      });
    }
    return service;
  }

  // Embedding generation is now handled by AiProcessor

  private async notifyAdmins(
    type: string,
    title: string,
    content: string,
    refId: number,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type,
          title,
          content,
          referenceId: refId,
        })),
      });
    }
  }
}
