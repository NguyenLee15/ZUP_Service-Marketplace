import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VnpayService } from './vnpay.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { generateVnpayTxnRef } from '../../common/utils/generate.util';

@Injectable()
export class ProviderWalletsService {
  private readonly logger = new Logger('ProviderWalletsService');

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
    private configService: ConfigService,
  ) {}

  async getBalance(providerId: number) {
    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Ví không tồn tại',
      });
    }
    return {
      data: {
        balance: wallet.balance,
        isRestricted: wallet.isRestricted,
      },
    };
  }

  async getHistory(providerId: number, type?: string, page = 1, limit = 20) {
    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Ví không tồn tại',
      });

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
    if (amount < 10000) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Số tiền tối thiểu 10,000đ',
      });
    }

    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (!wallet)
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Ví không tồn tại',
      });

    const txnRef = generateVnpayTxnRef();
    const returnUrl =
      this.configService.get<string>('FRONTEND_URL') + '/payment/return';

    // Tạo pending transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        vnpayTxnRef: txnRef,
      },
    });

    const paymentUrl = this.vnpayService.createPaymentUrl({
      amount,
      txnRef,
      orderInfo: `Nap vi provider ${providerId}`,
      returnUrl: returnUrl || 'http://localhost:3000/payment/return',
      ipAddress,
    });

    return { data: { paymentUrl, txnRef } };
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
