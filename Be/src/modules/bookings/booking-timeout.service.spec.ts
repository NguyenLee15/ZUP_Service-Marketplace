import { BookingStatus } from '@prisma/client';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingTimeoutService } from './booking-timeout.service';

type MockPrisma = {
  booking: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
};

type BookingUpdateManyCall = [
  {
    where: {
      id: number;
      status: BookingStatus;
      providerAcceptedAt: null;
    };
    data: { status: BookingStatus };
  },
];

describe('BookingTimeoutService', () => {
  let prisma: MockPrisma;
  let shared: jest.Mocked<
    Pick<BookingSharedService, 'addStatusHistory' | 'notify'>
  >;
  let policy: jest.Mocked<Pick<BookingStatePolicy, 'assertTransition'>>;
  let service: BookingTimeoutService;

  beforeEach(() => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    shared = {
      addStatusHistory: jest.fn(),
      notify: jest.fn(),
    };
    policy = {
      assertTransition: jest.fn(),
    };
    service = new BookingTimeoutService(
      prisma as never,
      shared as unknown as BookingSharedService,
      policy,
    );
  });

  it('expires overdue pending provider acceptance through state policy', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 10,
      bookingCode: 'BK001',
      customerId: 1,
      providerId: 2,
      status: BookingStatus.PENDING,
      providerAcceptedAt: null,
      providerResponseDeadline: new Date(Date.now() - 1000),
    });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.expireProviderAcceptance(10)).resolves.toBe(true);

    expect(policy.assertTransition).toHaveBeenCalledWith(
      BookingStatus.PENDING,
      BookingStatus.CANCELLED,
    );
    const updateCalls = prisma.booking.updateMany.mock
      .calls as unknown as BookingUpdateManyCall[];
    const updateArgs = updateCalls[0]?.[0];
    expect(updateArgs).toBeDefined();
    if (!updateArgs) return;
    expect(updateArgs.where).toMatchObject({
      id: 10,
      status: BookingStatus.PENDING,
      providerAcceptedAt: null,
    });
    expect(updateArgs.data).toEqual({ status: BookingStatus.CANCELLED });
    expect(shared.addStatusHistory).toHaveBeenCalledWith(
      10,
      'PENDING',
      'CANCELLED',
      2,
      expect.any(String),
    );
  });

  it('does not expire booking that is not pending', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 10,
      bookingCode: 'BK001',
      customerId: 1,
      providerId: 2,
      status: BookingStatus.CONFIRMED,
      providerAcceptedAt: new Date(),
      providerResponseDeadline: new Date(Date.now() - 1000),
    });

    await expect(service.expireProviderAcceptance(10)).resolves.toBe(false);

    expect(policy.assertTransition).not.toHaveBeenCalled();
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });
});
