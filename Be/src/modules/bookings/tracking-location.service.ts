import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  createTrackingLocationStore,
  TrackingLocationStore,
} from './tracking-location.store';

@Injectable()
export class TrackingLocationService {
  private readonly locationStore: TrackingLocationStore;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.locationStore = createTrackingLocationStore(redis);
  }

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

    const location = await this.locationStore.get(bookingId);

    return { data: location };
  }
}
