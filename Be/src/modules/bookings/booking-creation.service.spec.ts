import { ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingIdempotencyService } from './booking-idempotency.service';
import { BookingTimeoutService } from './booking-timeout.service';
import { BookingCreationService } from './booking-creation.service';

describe('BookingCreationService idempotency', () => {
  it('completes idempotency before post-commit notification failures', async () => {
    const booking = {
      id: 42,
      bookingCode: 'BK-42',
      customerId: 7,
      providerId: 8,
      serviceId: 99,
      createdAt: new Date(),
    };
    const tx = {
      $executeRaw: jest.fn(),
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(booking),
      },
      bookingItem: { createMany: jest.fn() },
    };
    const prisma = {
      service: {
        findFirst: jest.fn().mockResolvedValue({
          id: 99,
          providerId: 8,
          status: ServiceStatus.ACTIVE,
          isDeleted: false,
        }),
      },
      serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      booking: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...booking, bookingItems: [] }),
      },
      $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const shared = {
      checkActiveUser: jest.fn(),
      addStatusHistory: jest.fn(),
      linkConversationToBooking: jest.fn(),
      notify: jest
        .fn()
        .mockRejectedValue(new Error('notification unavailable')),
    };
    const idempotency = {
      claim: jest.fn().mockResolvedValue({ status: 'CLAIMED', id: 11 }),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BookingCreationService(
      prisma as unknown as PrismaService,
      shared as unknown as BookingSharedService,
      {
        scheduleProviderAcceptanceTimeout: jest.fn(),
      } as unknown as BookingTimeoutService,
      { assertTransition: jest.fn() } as unknown as BookingStatePolicy,
      idempotency as unknown as BookingIdempotencyService,
    );

    const result = await service.create(
      7,
      {
        serviceId: 99,
        description: 'Test booking',
        desiredTime: new Date(Date.now() + 60_000).toISOString(),
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        addressDetail: '1 Test Street',
      },
      'idem-1',
    );

    expect(result.data).toEqual(expect.objectContaining({ id: 42 }));
    expect(idempotency.complete).toHaveBeenCalledWith(
      11,
      201,
      expect.objectContaining({ message: 'Đặt dịch vụ thành công' }),
    );
    expect(idempotency.fail).not.toHaveBeenCalled();
  });
});
