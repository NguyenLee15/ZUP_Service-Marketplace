import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

export const TRACKING_LOCATION_KEY_PREFIX = 'tracking:';

export type TrackingLocation = {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: string;
};

@Injectable()
export class TrackingLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getForCustomer(bookingId: number, customerId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      },
      select: { id: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Đơn hàng không tồn tại hoặc không thể theo dõi',
      });
    }

    const location = this.redis.isEnabled()
      ? await this.redis.getJson<TrackingLocation>(
          `${TRACKING_LOCATION_KEY_PREFIX}${bookingId}`,
        )
      : null;

    return { data: location };
  }
}
