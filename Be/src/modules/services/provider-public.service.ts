import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicProviderServicesQuery } from './service-query.types';

@Injectable()
export class ProviderPublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicDetail(serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        status: ServiceStatus.ACTIVE,
        isDeleted: false,
        provider: {
          status: 'ACTIVE',
          providerWallet: { isRestricted: false },
        },
      },
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
        items: true,
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

  async getServiceReviews(
    serviceId: number,
    rating?: number,
    page = 1,
    limit = 10,
  ) {
    const where: Prisma.ReviewWhereInput = { serviceId, isFlagged: false };
    if (rating) where.rating = rating;

    const [data, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { serviceId },
        _count: { rating: true },
      }),
    ]);

    const distribution = Object.fromEntries(
      [1, 2, 3, 4, 5].map((r) => [
        r,
        stats.find((s) => s.rating === r)?._count?.rating || 0,
      ]),
    );

    return { data, meta: { total, page, limit, distribution } };
  }

  async getProviderMetrics(providerId: number) {
    const [responseTimeData, completionData] = await Promise.all([
      this.prisma.$queryRaw<Array<{ avg_response_hours: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (bsh.created_at - b.created_at)) / 3600) as avg_response_hours
        FROM booking_status_histories bsh
        JOIN bookings b ON bsh.booking_id = b.id
        WHERE b.provider_id = ${providerId}
          AND bsh.to_status = 'QUOTED'
          AND bsh.from_status = 'PENDING'
      `,
      this.prisma.booking.groupBy({
        by: ['status'],
        where: {
          providerId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'DONE', 'DISPUTED'] },
        },
        _count: true,
      }),
    ]);

    const avgResponseHours = responseTimeData[0]?.avg_response_hours
      ? Number(responseTimeData[0].avg_response_hours)
      : null;

    const statusCounts = completionData.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {},
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

  async getPublicProviderProfile(providerId: number) {
    const provider = await this.prisma.user.findFirst({
      where: {
        id: providerId,
        role: 'PROVIDER',
        status: 'ACTIVE',
        providerWallet: { isRestricted: false },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        email: true,
        createdAt: true,
        addresses: {
          where: { isDefault: true },
          select: {
            province: true,
            district: true,
            ward: true,
            addressDetail: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Không tìm thấy nhà cung cấp hoặc tài khoản đã bị khóa',
      });
    }

    const [aggregateReviews, totalServices, metricsResult] = await Promise.all([
      this.prisma.review.aggregate({
        where: {
          service: {
            providerId: provider.id,
            isDeleted: false,
          },
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.service.count({
        where: {
          providerId: provider.id,
          status: 'ACTIVE',
          isDeleted: false,
        },
      }),
      this.getProviderMetrics(provider.id),
    ]);

    return {
      data: {
        id: provider.id,
        fullName: provider.fullName,
        avatarUrl: provider.avatarUrl,
        phone: provider.phone,
        email: provider.email,
        createdAt: provider.createdAt,
        address: provider.addresses[0] || null,
        stats: {
          avgRating: aggregateReviews._avg.rating
            ? Number(aggregateReviews._avg.rating.toFixed(1))
            : 0,
          totalReviews: aggregateReviews._count.rating || 0,
          totalServices,
        },
        metrics: metricsResult.data,
      },
    };
  }

  async getPublicProviderServices(
    providerId: number,
    queryParams: PublicProviderServicesQuery,
  ) {
    const page = queryParams.page ?? 1;
    const limit = queryParams.limit ?? 8;
    const skip = (page - 1) * limit;
    const search = queryParams.search
      ? String(queryParams.search).trim()
      : undefined;
    const sortBy = queryParams.sortBy || 'newest';

    const whereClause: Prisma.ServiceWhereInput = {
      providerId,
      status: ServiceStatus.ACTIVE,
      isDeleted: false,
      provider: {
        status: 'ACTIVE',
        providerWallet: { isRestricted: false },
      },
    };

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    let orderByClause: Prisma.ServiceOrderByWithRelationInput = { id: 'desc' };
    if (sortBy === 'rating') orderByClause = { avgRating: 'desc' };
    else if (sortBy === 'priceAsc') orderByClause = { referencePrice: 'asc' };
    else if (sortBy === 'priceDesc') orderByClause = { referencePrice: 'desc' };

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: whereClause,
        include: {
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          category: true,
        },
        skip,
        take: limit,
        orderBy: orderByClause,
      }),
      this.prisma.service.count({
        where: whereClause,
      }),
    ]);

    return {
      data: services,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
