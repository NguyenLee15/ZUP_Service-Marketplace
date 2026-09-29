import { BadRequestException } from '@nestjs/common';
import { IdempotencyStatus, Prisma } from '@prisma/client';
import { WalletIdempotencyService } from './wallet-idempotency.service';

describe('WalletIdempotencyService', () => {
  const prisma = {
    walletIdempotencyKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: WalletIdempotencyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletIdempotencyService(prisma as never);
  });

  it('rejects missing and non-v4 idempotency keys', () => {
    expect(() => service.assertValidKey(undefined)).toThrow(
      BadRequestException,
    );
    expect(() => service.assertValidKey('not-a-uuid')).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.assertValidKey('00000000-0000-0000-8000-000000000000'),
    ).toThrow(BadRequestException);
  });

  it('claims a valid key and stores a stable payload hash', async () => {
    prisma.walletIdempotencyKey.create.mockResolvedValue({ id: 4 });
    const key = '11111111-1111-4111-8111-111111111111';

    const result = await service.claim(
      8,
      'wallet:deposit',
      key,
      service.hashPayload({ amount: 10000 }),
    );

    expect(result).toEqual({ kind: 'CLAIMED', id: 4 });
    expect(prisma.walletIdempotencyKey.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: 8,
        scope: 'wallet:deposit',
        key,
        status: IdempotencyStatus.PROCESSING,
      }),
    });
  });

  it('replays a completed response for the same payload', async () => {
    const key = '11111111-1111-4111-8111-111111111111';
    const hash = service.hashPayload({ amount: 10000 });
    prisma.walletIdempotencyKey.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    prisma.walletIdempotencyKey.findUnique.mockResolvedValue({
      id: 4,
      requestHash: hash,
      status: IdempotencyStatus.COMPLETED,
      statusCode: 201,
      responseBody: { data: { txnRef: 'txn-1' } },
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.claim(8, 'wallet:deposit', key, hash),
    ).resolves.toEqual({
      kind: 'REPLAY',
      statusCode: 201,
      responseBody: { data: { txnRef: 'txn-1' } },
    });
  });
});
