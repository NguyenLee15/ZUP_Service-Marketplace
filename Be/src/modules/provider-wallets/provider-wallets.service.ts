import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VnpayService } from './vnpay.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateVnpayTxnRef } from '../../common/utils/generate.util';

@Injectable()
export class ProviderWalletsService {
  private readonly logger = new Logger('ProviderWalletsService');
  private readonly minDepositAmount = 10000;
  private readonly minWithdrawalAmount = 50000;

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
    private configService: ConfigService,
  ) {}

  private assertAmount(
    amount: number,
    minAmount: number,
    message: string,
  ): number {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < minAmount) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message,
      });
    }

    return normalizedAmount;
  }

  private assertText(value: unknown, fieldName: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `${fieldName} không được để trống`,
      });
    }

    return normalized;
  }

  private generateManualDepositCode(providerId: number): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `NAPVI-${providerId}-${timestamp}-${suffix}`;
  }

  private async getWalletOrThrow(providerId: number) {
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

  private async getOrCreateWallet(
    tx: Prisma.TransactionClient,
    providerId: number,
  ) {
    const wallet = await tx.providerWallet.findUnique({
      where: { providerId },
    });
    if (wallet) return wallet;

    return tx.providerWallet.create({
      data: { providerId, balance: 0 },
    });
  }

  async getBalance(providerId: number) {
    const wallet = await this.getWalletOrThrow(providerId);
    return {
      data: {
        balance: wallet.balance,
        isRestricted: wallet.isRestricted,
      },
    };
  }

  async getHistory(providerId: number, type?: string, page = 1, limit = 20) {
    const wallet = await this.getWalletOrThrow(providerId);

    const where: any = { walletId: wallet.id };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: { booking: { select: { id: true, bookingCode: true } } },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createDepositRequest(
    providerId: number,
    amount: number,
    ipAddress: string,
  ) {
    const depositAmount = this.assertAmount(
      amount,
      this.minDepositAmount,
      'Số tiền tối thiểu 10,000đ',
    );

    const wallet = await this.getWalletOrThrow(providerId);

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

    // Tạo pending transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: depositAmount,
        status: 'PENDING',
        vnpayTxnRef: txnRef,
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
    const depositAmount = this.assertAmount(
      amount,
      this.minDepositAmount,
      'Số tiền nạp tối thiểu 10,000đ',
    );

    await this.getWalletOrThrow(providerId);

    const request = await this.prisma.manualDepositRequest.create({
      data: {
        providerId,
        amount: depositAmount,
        transferCode: transferCode?.trim() || this.generateManualDepositCode(providerId),
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

  async createWithdrawalRequest(
    providerId: number,
    data: {
      amount: number;
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
    },
  ) {
    const amount = this.assertAmount(
      data.amount,
      this.minWithdrawalAmount,
      'Số tiền rút tối thiểu 50,000đ',
    );
    const bankName = this.assertText(data.bankName, 'Tên ngân hàng');
    const bankAccountNumber = this.assertText(
      data.bankAccountNumber,
      'Số tài khoản',
    );
    const bankAccountHolder = this.assertText(
      data.bankAccountHolder,
      'Tên chủ tài khoản',
    );

    const wallet = await this.getWalletOrThrow(providerId);
    if (wallet.isRestricted || Number(wallet.balance) <= 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Ví đang bị giới hạn hoặc không có số dư để rút',
      });
    }

    const pending = await this.prisma.withdrawalRequest.aggregate({
      where: { providerId, status: 'PENDING' },
      _sum: { amount: true },
    });
    const lockedAmount = Number(pending._sum.amount || 0);
    const availableBalance = Number(wallet.balance) - lockedAmount;
    if (amount > availableBalance) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `Số dư khả dụng không đủ. Khả dụng: ${availableBalance.toLocaleString('vi-VN')}đ`,
      });
    }

    const request = await this.prisma.withdrawalRequest.create({
      data: {
        providerId,
        amount,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
      },
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

  async adminListManualDepositRequests(
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.ManualDepositRequestWhereInput = {};
    if (status && status !== 'all') {
      where.status = status as any;
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

      const wallet = await this.getOrCreateWallet(tx, request.providerId);
      const amount = Number(request.amount);

      const updatedWallet = await tx.providerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          isRestricted:
            Number(wallet.balance) + amount >= 0 ? false : wallet.isRestricted,
        },
      });

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount,
          status: 'SUCCESS',
        },
      });

      const updatedRequest = await tx.manualDepositRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNote: note?.trim() || null,
          processedBy: adminId,
          processedAt: new Date(),
        },
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

      return { request: updatedRequest, wallet: updatedWallet };
    });

    return { data: approved.request, message: 'Đã xác nhận nạp tiền' };
  }

  async adminRejectManualDeposit(
    adminId: number,
    id: number,
    note?: string,
  ) {
    const request = await this.prisma.manualDepositRequest.findUnique({
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

    const updated = await this.prisma.manualDepositRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: note?.trim() || null,
        processedBy: adminId,
        processedAt: new Date(),
      },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        processor: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: request.providerId,
        type: 'MANUAL_DEPOSIT_REJECTED',
        title: 'Yêu cầu nạp tiền bị từ chối',
        content: note?.trim() || 'Admin chưa xác nhận được giao dịch nạp tiền.',
        referenceId: id,
      },
    });

    return { data: updated, message: 'Đã từ chối yêu cầu nạp tiền' };
  }

  async adminListWithdrawalRequests(
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (status && status !== 'all') {
      where.status = status as any;
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

  async adminApproveWithdrawal(adminId: number, id: number, note?: string) {
    const approved = await this.prisma.$transaction(async (tx) => {
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
      if (Number(wallet.balance) < amount) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Số dư ví không đủ để duyệt yêu cầu rút',
        });
      }

      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: -amount,
          status: 'SUCCESS',
        },
      });

      const updatedRequest = await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNote: note?.trim() || null,
          processedBy: adminId,
          processedAt: new Date(),
        },
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
          title: 'Yêu cầu rút tiền đã được chuyển khoản',
          content: `Admin đã xác nhận chuyển ${amount.toLocaleString('vi-VN')}₫ về tài khoản ngân hàng của bạn.`,
          referenceId: id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'WITHDRAWAL_APPROVED',
          targetType: 'WALLET',
          targetId: walletTransaction.id,
          description: `Xác nhận rút ${amount.toLocaleString('vi-VN')}₫ cho provider ${request.providerId}`,
          ipAddress: 'System',
        },
      });

      return updatedRequest;
    });

    return { data: approved, message: 'Đã xác nhận rút tiền' };
  }

  async adminRejectWithdrawal(adminId: number, id: number, note?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
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

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: note?.trim() || null,
        processedBy: adminId,
        processedAt: new Date(),
      },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        processor: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: request.providerId,
        type: 'WITHDRAWAL_REJECTED',
        title: 'Yêu cầu rút tiền bị từ chối',
        content: note?.trim() || 'Admin đã từ chối yêu cầu rút tiền.',
        referenceId: id,
      },
    });

    return { data: updated, message: 'Đã từ chối yêu cầu rút tiền' };
  }

  async handleIpn(query: Record<string, string>) {
    const result = this.vnpayService.verifyIpn(query);

    if (!result.isValid) {
      this.logger.warn(`Invalid IPN hash: ${result.txnRef}`);
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    if (result.responseCode !== '00') {
      // Thanh toán thất bại
      await this.prisma.walletTransaction.updateMany({
        where: { vnpayTxnRef: result.txnRef, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    // Idempotency: đã xử lý rồi thì trả OK
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { vnpayTxnRef: result.txnRef, status: 'SUCCESS' },
    });
    if (existing) {
      return { RspCode: '00', Message: 'Already processed' };
    }

    // Transaction: cộng tiền
    await this.prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.findFirst({
        where: { vnpayTxnRef: result.txnRef, status: 'PENDING' },
      });
      if (!txn) return;

      await tx.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'SUCCESS' },
      });

      const wallet = await tx.providerWallet.update({
        where: { id: txn.walletId },
        data: { balance: { increment: result.amount } },
      });

      // Gỡ restricted nếu balance >= 0
      if (Number(wallet.balance) >= 0 && wallet.isRestricted) {
        await tx.providerWallet.update({
          where: { id: wallet.id },
          data: { isRestricted: false },
        });
      }

      // Notification
      await tx.notification.create({
        data: {
          userId: wallet.providerId,
          type: 'DEPOSIT_SUCCESS',
          title: 'Nạp tiền thành công',
          content: `Bạn đã nạp thành công ${result.amount.toLocaleString('vi-VN')}₫ vào ví`,
          referenceId: txn.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: wallet.providerId,
          action: 'VNPAY_DEPOSIT_SUCCESS',
          targetType: 'WALLET',
          targetId: txn.id,
          description: `Nạp thành công ${result.amount.toLocaleString('vi-VN')}₫ vào ví. Ref: ${result.txnRef}`,
          ipAddress: 'System',
        },
      });
    });

    this.logger.log(
      `IPN processed: ${result.txnRef}, amount: ${result.amount}`,
    );
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
