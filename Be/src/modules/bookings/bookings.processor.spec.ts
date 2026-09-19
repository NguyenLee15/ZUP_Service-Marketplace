import { BookingStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingsProcessor } from './bookings.processor';
import { BookingCommissionService } from './booking-commission.service';
import { BookingIdPayload, JobName } from '../../shared/jobs/jobs.service';
import { RedisService } from '../../shared/redis/redis.service';

describe('BookingsProcessor', () => {
  it('does not append DONE history when dispute claims the booking first', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const historyCreate = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: 42,
          status: BookingStatus.IN_PROGRESS,
        }),
      },
      $transaction: jest.fn(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            booking: { updateMany },
            bookingStatusHistory: { create: historyCreate },
          }),
      ),
    };
    const processor = new BookingsProcessor(
      prisma as never,
      {} as RedisService,
      {} as EventEmitter2,
      {} as BookingCommissionService,
    );

    const job = {
      name: JobName.BookingSlaStuckInProgress,
      data: { bookingId: 42 },
    } as Job<BookingIdPayload, void, JobName>;

    await processor.process(job);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 42, status: BookingStatus.IN_PROGRESS },
      data: { status: BookingStatus.DONE, completedAt: expect.any(Date) },
    });
    expect(historyCreate).not.toHaveBeenCalled();
  });
});
