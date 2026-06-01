import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingQueryService } from './booking-query.service';
import { BookingSharedService } from './booking-shared.service';

type BookingPrismaMock = {
  booking: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  bookingStatusHistory: {
    findMany: jest.Mock;
  };
};

describe('BookingQueryService ownership', () => {
  let service: BookingQueryService;
  let prisma: BookingPrismaMock;

  beforeEach(() => {
    prisma = {
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      bookingStatusHistory: {
        findMany: jest.fn(),
      },
    };

    service = new BookingQueryService(
      prisma as unknown as PrismaService,
      {
        isBookingStatus: jest.fn().mockReturnValue(false),
      } as unknown as BookingSharedService,
    );
  });

  it('rejects detail access when user is not customer or provider of booking', async () => {
    await expect(service.getById(77, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 77,
          OR: [{ customerId: 10 }, { providerId: 10 }],
        },
      }),
    );
  });

  it('lists only bookings scoped to the current customer or provider', async () => {
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.count.mockResolvedValue(0);

    await service.getMyBookings(10, 'customer');
    await service.getMyBookings(20, 'provider');

    expect(prisma.booking.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { customerId: 10 } }),
    );
    expect(prisma.booking.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { providerId: 20 } }),
    );
  });

  it('returns timeline only when current user belongs to booking', async () => {
    prisma.booking.findFirst.mockResolvedValue({ id: 77 });
    prisma.bookingStatusHistory.findMany.mockResolvedValue([
      { id: 1, bookingId: 77, fromStatus: 'PENDING', toStatus: 'ACCEPTED' },
    ]);

    const result = await service.getTimeline(77, 10);

    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 77,
        OR: [{ customerId: 10 }, { providerId: 10 }],
      },
      select: { id: true },
    });
    expect(result.data).toHaveLength(1);
  });

  it('rejects timeline access when current user is not a booking member', async () => {
    await expect(service.getTimeline(77, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.bookingStatusHistory.findMany).not.toHaveBeenCalled();
  });

  it('allows admin timeline access after booking existence check', async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: 77 });
    prisma.bookingStatusHistory.findMany.mockResolvedValue([]);

    await service.getTimelineForAdmin(77);

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: 77 },
      select: { id: true },
    });
    expect(prisma.bookingStatusHistory.findMany).toHaveBeenCalledWith({
      where: { bookingId: 77 },
      orderBy: { createdAt: 'asc' },
    });
  });
});
