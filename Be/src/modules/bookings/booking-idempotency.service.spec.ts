import { ConflictException } from '@nestjs/common';
import { BookingIdempotencyService } from './booking-idempotency.service';

describe('BookingIdempotencyService', () => {
  it('claims a new key atomically and returns the completed response on retry', async () => {
    const prisma = {
      idempotencyKey: {
        create: jest.fn().mockResolvedValue({
          id: 1,
          status: 'PROCESSING',
          requestHash: 'hash-a',
          responseBody: null,
          statusCode: null,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          status: 'COMPLETED',
          requestHash: 'hash-a',
          responseBody: { data: { id: 99 } },
          statusCode: 201,
        }),
        update: jest.fn(),
      },
    };
    const service = new BookingIdempotencyService(prisma as never);

    const claim = await service.claim(7, 'booking:create', 'key-a', 'hash-a');
    expect(claim.status).toBe('CLAIMED');

    const replay = await service.replayOrConflict(
      7,
      'booking:create',
      'key-a',
      'hash-a',
    );
    expect(replay).toEqual({ statusCode: 201, body: { data: { id: 99 } } });
  });

  it('rejects a concurrent in-flight request', async () => {
    const prisma = {
      idempotencyKey: {
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: jest.fn().mockResolvedValue({
          status: 'PROCESSING',
          requestHash: 'hash-a',
          responseBody: null,
          statusCode: null,
        }),
      },
    };
    const service = new BookingIdempotencyService(prisma as never);

    await expect(
      service.claim(7, 'booking:create', 'key-a', 'hash-a'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects reuse of a key with a different request hash', async () => {
    const prisma = {
      idempotencyKey: {
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: jest.fn().mockResolvedValue({
          status: 'COMPLETED',
          requestHash: 'hash-a',
          responseBody: { data: { id: 99 } },
          statusCode: 201,
        }),
      },
    };
    const service = new BookingIdempotencyService(prisma as never);

    await expect(
      service.claim(7, 'booking:create', 'key-a', 'hash-b'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a controlled retry after a failed claim', async () => {
    const prisma = {
      idempotencyKey: {
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          status: 'FAILED',
          requestHash: 'hash-a',
          responseBody: null,
          statusCode: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new BookingIdempotencyService(prisma as never);

    await expect(
      service.claim(7, 'booking:create', 'key-a', 'hash-a'),
    ).resolves.toEqual({ status: 'CLAIMED', id: 1 });
  });
});
