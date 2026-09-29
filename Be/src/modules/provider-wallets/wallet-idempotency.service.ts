import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { IdempotencyStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClaimResult =
  | { kind: 'CLAIMED'; id: number }
  | {
      kind: 'REPLAY';
      statusCode: number;
      responseBody: Prisma.JsonValue | null;
    };

@Injectable()
export class WalletIdempotencyService {
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  assertValidKey(key: string | undefined): asserts key is string {
    if (!key || !UUID_V4.test(key)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Idempotency-Key phải là UUIDv4 hợp lệ',
      });
    }
  }

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async claim(
    providerId: number,
    scope: string,
    key: string,
    requestHash: string,
  ): Promise<ClaimResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlMs);
    try {
      const record = await this.prisma.walletIdempotencyKey.create({
        data: {
          providerId,
          scope,
          key,
          requestHash,
          status: IdempotencyStatus.PROCESSING,
          expiresAt,
        },
      });
      return { kind: 'CLAIMED' as const, id: record.id };
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      const existing = await this.prisma.walletIdempotencyKey.findUnique({
        where: { providerId_scope_key: { providerId, scope, key } },
      });
      if (!existing) throw error;
      if (existing.expiresAt <= now) {
        await this.prisma.walletIdempotencyKey.delete({
          where: { id: existing.id },
        });
        return this.claim(providerId, scope, key, requestHash);
      }
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: ErrorCodes.IDEMPOTENCY_CONFLICT,
          message: 'Idempotency-Key đã được dùng cho payload khác',
        });
      }
      if (existing.status === IdempotencyStatus.COMPLETED) {
        return {
          kind: 'REPLAY' as const,
          statusCode: existing.statusCode ?? 200,
          responseBody: existing.responseBody,
        };
      }
      if (existing.status === IdempotencyStatus.FAILED) {
        const reclaimed = await this.prisma.walletIdempotencyKey.updateMany({
          where: { id: existing.id, status: IdempotencyStatus.FAILED },
          data: {
            status: IdempotencyStatus.PROCESSING,
            expiresAt,
            responseBody: Prisma.DbNull,
            statusCode: null,
          },
        });
        if (reclaimed.count === 1)
          return { kind: 'CLAIMED' as const, id: existing.id };
      }
      throw new ConflictException({
        code: ErrorCodes.IDEMPOTENCY_CONFLICT,
        message: 'Yêu cầu đang được xử lý',
      });
    }
  }

  async complete(id: number, statusCode: number, responseBody: unknown) {
    await this.prisma.walletIdempotencyKey.update({
      where: { id },
      data: {
        status: IdempotencyStatus.COMPLETED,
        statusCode,
        responseBody: JSON.parse(
          JSON.stringify(responseBody),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  async fail(id: number) {
    await this.prisma.walletIdempotencyKey.update({
      where: { id },
      data: {
        status: IdempotencyStatus.FAILED,
        statusCode: null,
        responseBody: Prisma.DbNull,
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
