import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  AdminWalletRequestQueryDto,
  WalletHistoryQueryDto,
} from './dto/wallet-query.dto';
import { WalletAccountService } from './wallet-account.service';
import { DepositService } from './deposit.service';
import { WithdrawalService } from './withdrawal.service';
import { PaymentCallbackService } from './payment-callback.service';

@Controller('provider-wallets')
export class ProviderWalletsController {
  constructor(
    private readonly walletAccountService: WalletAccountService,
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
    private readonly paymentCallbackService: PaymentCallbackService,
  ) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getBalance(@CurrentUser('id') userId: number) {
    return this.walletAccountService.getBalance(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getHistory(
    @CurrentUser('id') userId: number,
    @Query() query: WalletHistoryQueryDto,
  ) {
    return this.walletAccountService.getHistory(
      userId,
      query.type,
      query.page,
      query.limit,
    );
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async deposit(
    @CurrentUser('id') userId: number,
    @Body('amount') amount: number,
    @Req() req: Request,
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === 'string'
          ? forwardedFor.split(',')[0]?.trim()
          : undefined) ||
      req.ip ||
      '127.0.0.1';
    return this.depositService.createDepositRequest(userId, amount, ip);
  }

  @Post('manual-deposits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async createManualDeposit(
    @CurrentUser('id') userId: number,
    @Body('amount') amount: number,
    @Body('transferCode') transferCode?: string,
    @Body('receiptUrl') receiptUrl?: string,
  ) {
    return this.depositService.createManualDepositRequest(
      userId,
      amount,
      transferCode,
      receiptUrl,
    );
  }

  @Get('manual-deposits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getManualDeposits(
    @CurrentUser('id') userId: number,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.depositService.getManualDepositRequests(
      userId,
      pagination?.page ?? 1,
      pagination?.limit ?? 20,
    );
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async createWithdrawal(
    @CurrentUser('id') userId: number,
    @Body()
    body: {
      amount: number;
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
    },
  ) {
    return this.withdrawalService.createWithdrawalRequest(userId, body);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getWithdrawals(
    @CurrentUser('id') userId: number,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.withdrawalService.getWithdrawalRequests(
      userId,
      pagination?.page ?? 1,
      pagination?.limit ?? 20,
    );
  }

  /** VNPay return (FE chỉ hiển thị kết quả) */
  @Get('vnpay/return')
  vnpayReturn(@Query() query: Record<string, string>) {
    return { data: query };
  }

  /** VNPay IPN — xử lý tiền (không cần auth) */
  @Get('vnpay/ipn')
  @SkipThrottle()
  async vnpayIpnGet(@Query() query: Record<string, string>) {
    return this.paymentCallbackService.handleVnpayIpn(query);
  }

  /** Giữ POST để tương thích với cấu hình callback cũ. */
  @Post('vnpay/ipn')
  @SkipThrottle()
  async vnpayIpnPost(@Query() query: Record<string, string>) {
    return this.paymentCallbackService.handleVnpayIpn(query);
  }
}

@Controller('admin/wallet-deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminWalletDepositsController {
  constructor(private readonly depositService: DepositService) {}

  @Get()
  async list(@Query() query: AdminWalletRequestQueryDto) {
    return this.depositService.adminListManualDepositRequests(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.depositService.adminApproveManualDeposit(
      adminId,
      parseInt(id),
      note,
    );
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.depositService.adminRejectManualDeposit(
      adminId,
      parseInt(id),
      note,
    );
  }
}

@Controller('admin/wallet-withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminWalletWithdrawalsController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  async list(@Query() query: AdminWalletRequestQueryDto) {
    return this.withdrawalService.adminListWithdrawalRequests(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.withdrawalService.adminApproveWithdrawal(
      adminId,
      parseInt(id),
      note,
    );
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.withdrawalService.adminRejectWithdrawal(
      adminId,
      parseInt(id),
      note,
    );
  }
}
