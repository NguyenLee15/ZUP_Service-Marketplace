import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type IdempotencyClaim =
  | { status: 'CLAIMED'; id: number }
  | { status: 'REPLAY'; statusCode: number; body: unknown };

type ExistingIdempotencyRecord = {
  id: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestHash: string;
  responseBody: unknown;
  statusCode: number | null;
  expiresAt?: Date;
};

@Injectable()
export class BookingIdempotencyService {
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async claim(
    customerId: number,
    scope: string,
    key: string,
    requestHash: string,
  ): Promise<IdempotencyClaim> {
    const expiresAt = new Date(Date.now() + this.ttlMs);
    try {
      const record = await this.prisma.idempotencyKey.create({
        data: {
          customerId,
          scope,
          key,
          requestHash,
          status: 'PROCESSING',
          expiresAt,
        },
      });
      return { status: 'CLAIMED', id: record.id };
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
    }

    const existing = (await this.prisma.idempotencyKey.findUnique({
      where: { customerId_scope_key: { customerId, scope, key } },
    })) as ExistingIdempotencyRecord | null;

    if (!existing || (existing.expiresAt && existing.expiresAt <= new Date())) {
      if (existing) {
        await this.prisma.idempotencyKey.delete({ where: { id: existing.id } });
      }
      return this.claim(customerId, scope, key, requestHash);
    }

    this.assertRequestMatches(existing, requestHash);
    if (existing.status === 'FAILED') {
      const reclaimed = await this.prisma.idempotencyKey.updateMany({
        where: { id: existing.id, status: 'FAILED' },
        data: {
          status: 'PROCESSING',
          expiresAt,
          responseBody: Prisma.JsonNull,
          statusCode: null,
        },
      });
      if (reclaimed.count === 1) {
        return { status: 'CLAIMED', id: existing.id };
      }
      return this.claim(customerId, scope, key, requestHash);
    }
    if (existing.status === 'COMPLETED' && existing.statusCode !== null) {
      return {
        status: 'REPLAY',
        statusCode: existing.statusCode,
        body: existing.responseBody,
      };
    }

    throw new ConflictException({
      code: 'IDEMPOTENCY_IN_PROGRESS',
      message: 'Một yêu cầu với Idempotency-Key này đang được xử lý.',
    });
  }

  async complete(id: number, statusCode: number, responseBody: unknown) {
    return this.prisma.idempotencyKey.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        statusCode,
        responseBody: JSON.parse(
          JSON.stringify(responseBody),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  async fail(id: number) {
    return this.prisma.idempotencyKey.update({
      where: { id },
      data: {
        status: 'FAILED',
        responseBody: Prisma.JsonNull,
        statusCode: null,
      },
    });
  }

  async replayOrConflict(
    customerId: number,
    scope: string,
    key: string,
    requestHash: string,
  ) {
    const record = (await this.prisma.idempotencyKey.findUnique({
      where: { customerId_scope_key: { customerId, scope, key } },
    })) as ExistingIdempotencyRecord | null;
    if (!record) return null;
    this.assertRequestMatches(record, requestHash);
    if (record.status === 'COMPLETED' && record.statusCode !== null) {
      return { statusCode: record.statusCode, body: record.responseBody };
    }
    throw new ConflictException({
      code: 'IDEMPOTENCY_IN_PROGRESS',
      message: 'Một yêu cầu với Idempotency-Key này đang được xử lý.',
    });
  }

  private assertRequestMatches(
    record: Pick<ExistingIdempotencyRecord, 'requestHash'>,
    requestHash: string,
  ) {
    if (record.requestHash !== requestHash) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency-Key đã được sử dụng cho payload khác.',
      });
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  static readonly bookingScope = 'booking:create';
}
