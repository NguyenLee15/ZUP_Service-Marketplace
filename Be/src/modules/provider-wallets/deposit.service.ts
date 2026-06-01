import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateVnpayTxnRef } from '../../common/utils/generate.util';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletLedgerService } from './wallet-ledger.service';
import { WalletSharedService } from './wallet-shared.service';
import { VnpayService } from './vnpay.service';

@Injectable()
export class DepositService {
  private readonly minDepositAmount = 10000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly walletLedgerService: WalletLedgerService,
    private readonly shared: WalletSharedService,
  ) {}

  async createDepositRequest(
    providerId: number,
    amount: number,
    ipAddress: string,
  ) {
    const depositAmount = this.shared.assertAmount(
      amount,
      this.minDepositAmount,
      'Số tiền tối thiểu 10,000đ',
    );

    const wallet = await this.shared.getWalletOrThrow(providerId);

    const txnRef = generateVnpayTxnRef();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const configuredReturnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL');
    const fallbackReturnUrl =
      this.configService.get<string>('vnpay.returnUrl') ||
      'http://localhost:3000/payment/return';
    const returnUrl =
      configuredReturnUrl ||
      (frontendUrl
        ? `${frontendUrl.replace(/\/$/, '')}/payment/return`
        : fallbackReturnUrl);

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: depositAmount,
        status: 'PENDING',
        vnpayTxnRef: txnRef,
        idempotencyKey: `vnpay:${txnRef}`,
      },
    });

    const paymentUrl = this.vnpayService.createPaymentUrl({
      amount: depositAmount,
      txnRef,
      orderInfo: `Nap vi provider ${providerId}`,
      returnUrl,
      ipAddress,
    });

    return { data: { paymentUrl, url: paymentUrl, txnRef } };
  }

  async createManualDepositRequest(
    providerId: number,
    amount: number,
    transferCode?: string,
    receiptUrl?: string,
  ) {
    const depositAmount = this.shared.assertAmount(
      amount,
      this.minDepositAmount,
      'Số tiền nạp tối thiểu 10,000đ',
    );

    await this.shared.getWalletOrThrow(providerId);

    const request = await this.prisma.manualDepositRequest.create({
      data: {
        providerId,
        amount: depositAmount,
        transferCode:
          transferCode?.trim() || this.generateManualDepositCode(providerId),
        receiptUrl: receiptUrl?.trim() || null,
      },
    });

    return {
      data: request,
      message:
        'Đã gửi yêu cầu nạp thủ công. Admin sẽ kiểm tra chuyển khoản và cộng ví.',
    };
  }

  async getManualDepositRequests(providerId: number, page = 1, limit = 20) {
    await this.shared.expireStaleManualDeposits();

    const where = { providerId };
    const [data, total] = await Promise.all([
      this.prisma.manualDepositRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.manualDepositRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminListManualDepositRequests(status?: string, page = 1, limit = 20) {
    await this.shared.expireStaleManualDeposits();

    const where: Prisma.ManualDepositRequestWhereInput = {};
    if (status && status !== 'all') {
      if (this.shared.isWalletRequestStatus(status)) where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.manualDepositRequest.findMany({
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
      this.prisma.manualDepositRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminApproveManualDeposit(adminId: number, id: number, note?: string) {
    const approved = await this.prisma.$transaction(async (tx) => {
      await this.shared.expireStaleManualDeposits(tx);

      const request = await tx.manualDepositRequest.findUnique({
        where: { id },
      });
      if (!request) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Yêu cầu nạp tiền không tồn tại',
        });
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message:
            request.status === 'EXPIRED'
              ? 'Yêu cầu nạp tiền đã quá 5 phút và tự hết hạn'
              : 'Yêu cầu này đã được xử lý',
        });
      }

      const claimed = await tx.manualDepositRequest.updateMany({
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

      const wallet = await this.shared.getOrCreateWallet(
        tx,
        request.providerId,
      );
      const amount = Number(request.amount);

      const walletTransaction = await this.walletLedgerService.creditWallet(
        tx,
        {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount,
          idempotencyKey: `manual-deposit:${id}`,
        },
      );

      const updatedRequest = await tx.manualDepositRequest.findUniqueOrThrow({
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
          type: 'MANUAL_DEPOSIT_APPROVED',
          title: 'Yêu cầu nạp tiền đã được xác nhận',
          content: `Ví của bạn đã được cộng ${amount.toLocaleString('vi-VN')}₫.`,
          referenceId: id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'MANUAL_DEPOSIT_APPROVED',
          targetType: 'WALLET',
          targetId: walletTransaction.id,
          description: `Xác nhận nạp thủ công ${amount.toLocaleString('vi-VN')}₫ cho provider ${request.providerId}`,
          ipAddress: 'System',
        },
      });

      return updatedRequest;
    });

    return { data: approved, message: 'Đã xác nhận nạp tiền' };
  }

  async adminRejectManualDeposit(adminId: number, id: number, note?: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.shared.expireStaleManualDeposits(tx);

      const request = await tx.manualDepositRequest.findUnique({
        where: { id },
      });
      if (!request) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Yêu cầu nạp tiền không tồn tại',
        });
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Yêu cầu này đã được xử lý',
        });
      }

      const claimed = await tx.manualDepositRequest.updateMany({
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

      const rejected = await tx.manualDepositRequest.findUniqueOrThrow({
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
          type: 'MANUAL_DEPOSIT_REJECTED',
          title: 'Yêu cầu nạp tiền bị từ chối',
          content:
            note?.trim() || 'Admin chưa xác nhận được giao dịch nạp tiền.',
          referenceId: id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'MANUAL_DEPOSIT_REJECTED',
          targetType: 'WALLET',
          targetId: id,
          description: `Từ chối nạp thủ công cho provider ${request.providerId}`,
          ipAddress: 'System',
        },
      });

      return rejected;
    });

    return { data: updated, message: 'Đã từ chối yêu cầu nạp tiền' };
  }

  private generateManualDepositCode(providerId: number): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `NAPVI-${providerId}-${timestamp}-${suffix}`;
  }
}
