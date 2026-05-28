import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingSharedService } from './booking-shared.service';

@Injectable()
export class BookingQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: BookingSharedService,
  ) {}

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
    const where: Prisma.BookingWhereInput =
      role === 'customer' ? { customerId: userId } : { providerId: userId };
    if (this.shared.isBookingStatus(status)) where.status = status;

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
}
