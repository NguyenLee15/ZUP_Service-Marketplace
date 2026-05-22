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
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProviderWalletsService } from './provider-wallets.service';

@Controller('provider-wallets')
export class ProviderWalletsController {
  constructor(private readonly walletsService: ProviderWalletsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getBalance(@CurrentUser('id') userId: number) {
    return this.walletsService.getBalance(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getHistory(
    @CurrentUser('id') userId: number,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.getHistory(
      userId,
      type,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async deposit(
    @CurrentUser('id') userId: number,
    @Body('amount') amount: number,
    @Req() req: any,
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
    return this.walletsService.createDepositRequest(userId, amount, ip);
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
    return this.walletsService.createManualDepositRequest(
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.getManualDepositRequests(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
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
    return this.walletsService.createWithdrawalRequest(userId, body);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getWithdrawals(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.getWithdrawalRequests(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** VNPay return (FE chỉ hiển thị kết quả) */
  @Get('vnpay/return')
  async vnpayReturn(@Query() query: Record<string, string>) {
    return { data: query };
  }

  /** VNPay IPN — xử lý tiền (không cần auth) */
  @Get('vnpay/ipn')
  @SkipThrottle()
  async vnpayIpnGet(@Query() query: Record<string, string>) {
    return this.walletsService.handleIpn(query);
  }

  /** Giữ POST để tương thích với cấu hình callback cũ. */
  @Post('vnpay/ipn')
  @SkipThrottle()
  async vnpayIpnPost(@Query() query: Record<string, string>) {
    return this.walletsService.handleIpn(query);
  }
}

@Controller('admin/wallet-deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminWalletDepositsController {
  constructor(private readonly walletsService: ProviderWalletsService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.adminListManualDepositRequests(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.walletsService.adminApproveManualDeposit(
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
    return this.walletsService.adminRejectManualDeposit(
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
  constructor(private readonly walletsService: ProviderWalletsService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.adminListWithdrawalRequests(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.walletsService.adminApproveWithdrawal(
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
    return this.walletsService.adminRejectWithdrawal(
      adminId,
      parseInt(id),
      note,
    );
  }
}
