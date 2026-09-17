import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletLedgerService } from './wallet-ledger.service';
import { WalletSharedService } from './wallet-shared.service';

export interface CreateWithdrawalRequestInput {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

@Injectable()
export class WithdrawalService {
  private readonly minWithdrawalAmount = 50000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletLedgerService: WalletLedgerService,
    private readonly shared: WalletSharedService,
  ) {}

  async createWithdrawalRequest(
    providerId: number,
    data: CreateWithdrawalRequestInput,
  ) {
    const amount = this.shared.assertAmount(
      data.amount,
      this.minWithdrawalAmount,
      'Số tiền rút tối thiểu 50,000đ',
    );
    const bankName = this.shared.assertText(data.bankName, 'Tên ngân hàng');
    const bankAccountNumber = this.shared.assertText(
      data.bankAccountNumber,
      'Số tài khoản',
    );
    const bankAccountHolder = this.shared.assertText(
      data.bankAccountHolder,
      'Tên chủ tài khoản',
    );

    const request = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.providerWallet.findUnique({
        where: { providerId },
      });
      if (!wallet) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Ví không tồn tại',
        });
      }
      if (wallet.isRestricted) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Ví đang bị giới hạn hoặc không có số dư để rút',
        });
      }

      const debited = await tx.providerWallet.updateMany({
        where: { providerId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debited.count === 0) {
        throw new BadRequestException('Số dư ví không đủ để rút tiền');
      }

      return tx.withdrawalRequest.create({
        data: {
          providerId,
          amount,
          bankName,
          bankAccountNumber,
          bankAccountHolder,
        },
      });
    });

    return {
      data: request,
      message:
        'Đã gửi yêu cầu rút tiền. Admin sẽ chuyển khoản thủ công sau khi kiểm tra.',
    };
  }

  async getWithdrawalRequests(providerId: number, page = 1, limit = 20) {
    const where = { providerId };
    const [data, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminListWithdrawalRequests(status?: string, page = 1, limit = 20) {
    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (status && status !== 'all') {
      if (this.shared.isWalletRequestStatus(status)) where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: {
          provider: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          processor: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminApproveWithdrawal(
    adminId: number,
    id: number,
    note?: string,
    ipAddress?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id },
      });
      if (!request) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Yêu cầu rút tiền không tồn tại',
        });
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Yêu cầu này đã được xử lý',
        });
      }

      const claimed = await tx.withdrawalRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          adminNote: note?.trim() || null,
          processedBy: adminId,
          processedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Yêu cầu này đã được xử lý',
        });
      }

      const wallet = await tx.providerWallet.findUnique({
        where: { providerId: request.providerId },
      });
      if (!wallet) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Ví không tồn tại',
        });
      }

      const amount = Number(request.amount);

      // Record final ledger transaction for the approved withdrawal
      // Amount was already debited and reserved upon withdrawal request creation.
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: -amount,
          status: 'SUCCESS',
          idempotencyKey: `withdrawal:${id}`,
          processedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'WITHDRAWAL_APPROVED',
          targetType: 'WALLET',
          targetId: transaction.id,
          description: `Xác nhận rút ${amount.toLocaleString('vi-VN')}₫ cho provider ${request.providerId}`,
          ipAddress: ipAddress || 'System',
        },
      });

      await this.walletLedgerService.syncWalletRestriction(
        wallet.providerId,
        tx,
      );

      const updatedRequest = await tx.withdrawalRequest.findUniqueOrThrow({
        where: { id },
        include: {
          provider: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          processor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: request.providerId,
          type: 'WITHDRAWAL_APPROVED',
          title: 'Yêu cầu rút tiền đã được xác nhận',
          content: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}₫ của bạn đã được chuyển khoản thành công.`,
          referenceId: id,
        },
      });

      return updatedRequest;
    });

    return {
      data: result,
      message: 'Đã xác nhận rút tiền',
    };
  }

  async adminRejectWithdrawal(
    adminId: number,
    id: number,
    note?: string,
    ipAddress?: string,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id },
        include: { provider: true },
      });
      if (!request) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Yêu cầu rút tiền không tồn tại',
        });
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Yêu cầu này đã được xử lý',
        });
      }

      const claimed = await tx.withdrawalRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          adminNote: note?.trim() || null,
          processedBy: adminId,
          processedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Yêu cầu này đã được xử lý',
        });
      }

      const wallet = await tx.providerWallet.findUnique({
        where: { providerId: request.providerId },
      });
      if (!wallet) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Ví không tồn tại',
        });
      }

      const amount = Number(request.amount);

      // Refund the reserved withdrawal amount back to provider wallet via ledger
      await this.walletLedgerService.creditWallet(tx, {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        idempotencyKey: `withdrawal-refund:${id}`,
        actorId: adminId,
        actionName: 'WITHDRAWAL_REJECTED',
        description: `Hoàn trả ${amount.toLocaleString('vi-VN')}₫ do từ chối yêu cầu rút tiền #${id}`,
        ipAddress: ipAddress || 'System',
      });

      const rejected = await tx.withdrawalRequest.findUniqueOrThrow({
        where: { id },
        include: {
          provider: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          processor: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: request.providerId,
          type: 'WITHDRAWAL_REJECTED',
          title: 'Yêu cầu rút tiền bị từ chối',
          content: note?.trim() || 'Admin đã từ chối yêu cầu rút tiền.',
          referenceId: id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'WITHDRAWAL_REJECTED',
          targetType: 'WALLET',
          targetId: id,
          description: `Từ chối rút tiền cho provider ${request.providerId}`,
          ipAddress: ipAddress || 'System',
        },
      });

      return rejected;
    });

    return { data: updated, message: 'Đã từ chối yêu cầu rút tiền' };
  }
}
