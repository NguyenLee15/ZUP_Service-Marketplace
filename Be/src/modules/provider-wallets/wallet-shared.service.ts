import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  WalletRequestStatus,
  WalletTransactionType,
} from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletSharedService {
  private readonly manualDepositTtlMs = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  assertAmount(amount: number, minAmount: number, message: string): number {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < minAmount) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message,
      });
    }

    return normalizedAmount;
  }

  assertText(value: unknown, fieldName: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `${fieldName} không được để trống`,
      });
    }

    return normalized;
  }

  async getWalletOrThrow(providerId: number) {
    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Ví không tồn tại',
      });
    }

    return wallet;
  }

  async getOrCreateWallet(tx: Prisma.TransactionClient, providerId: number) {
    const wallet = await tx.providerWallet.findUnique({
      where: { providerId },
    });
    if (wallet) return wallet;

    return tx.providerWallet.create({
      data: { providerId, balance: 0 },
    });
  }

  async expireStaleManualDeposits(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await tx.manualDepositRequest.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: this.getManualDepositExpiryDate() },
      },
      data: {
        status: 'EXPIRED',
        adminNote: 'Yêu cầu nạp tiền đã quá 5 phút và tự hết hạn.',
        processedAt: new Date(),
      },
    });
  }

  isWalletTransactionType(value: unknown): value is WalletTransactionType {
    return (
      typeof value === 'string' &&
      Object.values(WalletTransactionType).includes(
        value as WalletTransactionType,
      )
    );
  }

  isWalletRequestStatus(value: unknown): value is WalletRequestStatus {
    return (
      typeof value === 'string' &&
      Object.values(WalletRequestStatus).includes(value as WalletRequestStatus)
    );
  }

  private getManualDepositExpiryDate() {
    return new Date(Date.now() - this.manualDepositTtlMs);
  }
}
