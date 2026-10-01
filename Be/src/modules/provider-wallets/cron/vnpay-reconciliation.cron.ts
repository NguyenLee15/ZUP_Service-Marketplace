import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayosService } from '../payos.service';

@Injectable()
export class VnpayReconciliationCron {
  private readonly logger = new Logger(VnpayReconciliationCron.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly payosService: PayosService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    if (this.isRunning) {
      this.logger.warn(
        'Cronjob đối soát thanh toán đang chạy từ chu kỳ trước. Bỏ qua chu kỳ này.',
      );
      return;
    }

    this.isRunning = true;
    try {
      this.logger.log('Bắt đầu chạy Cronjob đối soát thanh toán...');

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Tìm tối đa 50 giao dịch nạp tiền bị kẹt PENDING quá 15 phút (FIFO)
      const stuckTxns = await this.prisma.walletTransaction.findMany({
        where: {
          type: 'DEPOSIT',
          status: 'PENDING',
          createdAt: {
            lte: fifteenMinutesAgo,
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      if (stuckTxns.length === 0) {
        this.logger.log('Không có giao dịch PENDING nào cần đối soát.');
        return;
      }

      this.logger.log(
        `Tìm thấy ${stuckTxns.length} giao dịch cần đối soát (tối đa 50/lần).`,
      );

      for (const txn of stuckTxns) {
        try {
          await this.reconcileTransaction(txn);
        } catch (itemError) {
          this.logger.error(
            `Lỗi khi đối soát giao dịch ID ${txn.id} (ref: ${txn.vnpayTxnRef}): ${itemError instanceof Error ? itemError.message : String(itemError)}`,
          );
        }
      }

      this.logger.log('Hoàn tất chu kỳ đối soát thanh toán.');
    } finally {
      this.isRunning = false;
    }
  }

  private async reconcileTransaction(txn: {
    id: number;
    amount: number | string | { toString(): string };
    vnpayTxnRef: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
  }) {
    // 1. Kiểm tra nếu là giao dịch PayOS (dựa trên idempotencyKey hoặc orderCode số)
    const isPayos =
      txn.idempotencyKey?.startsWith('payos_dep_') ||
      (txn.vnpayTxnRef && /^\d{6,16}$/.test(txn.vnpayTxnRef));

    if (isPayos && txn.vnpayTxnRef) {
      const orderCode = Number(txn.vnpayTxnRef);
      if (!isNaN(orderCode)) {
        const payosStatus =
          await this.payosService.checkPaymentStatus(orderCode);
        if (payosStatus) {
          if (payosStatus.status === 'PAID') {
            this.logger.log(
              `PayOS orderCode ${orderCode} đã thanh toán thành công trên cổng. Tiến hành cộng tiền vào ví.`,
            );
            await this.payosService.handleSuccessPayment(
              txn.vnpayTxnRef,
              Number(txn.amount),
            );
            return;
          } else if (
            payosStatus.status === 'CANCELLED' ||
            payosStatus.status === 'EXPIRED' ||
            payosStatus.status === 'FAILED'
          ) {
            this.logger.log(
              `PayOS orderCode ${orderCode} đã kết thúc với trạng thái ${payosStatus.status}. Cập nhật FAILED.`,
            );
            await this.prisma.walletTransaction.updateMany({
              where: { id: txn.id, status: 'PENDING' },
              data: { status: 'FAILED' },
            });
            return;
          } else {
            // Vẫn đang PENDING trên PayOS: giữ nguyên để chờ webhook hoặc người dùng hoàn tất
            this.logger.log(
              `PayOS orderCode ${orderCode} vẫn đang PENDING trên cổng. Bỏ qua.`,
            );
            return;
          }
        }
      }
    }

    // 2. Với VNPay hoặc giao dịch quá 30 phút không phản hồi
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (txn.createdAt <= thirtyMinutesAgo) {
      await this.prisma.walletTransaction.updateMany({
        where: { id: txn.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      this.logger.log(
        `Đã chuyển giao dịch ${txn.vnpayTxnRef ?? txn.id} thành FAILED do quá 30 phút không hoàn tất.`,
      );
    }
  }
}
