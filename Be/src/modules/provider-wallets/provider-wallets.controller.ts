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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WalletRequestStatus, WalletTransactionType } from '@prisma/client';
import type { Request } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminPermission } from '../../common/constants/admin-permissions';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/decorators/api-contract.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  AdminWalletActionDto,
  AdminWalletRequestQueryDto,
  CreateWithdrawalRequestDto,
  DepositRequestDto,
  ManualDepositRequestDto,
  WalletHistoryQueryDto,
} from './dto/wallet-query.dto';
import { WalletAccountService } from './wallet-account.service';
import { DepositService } from './deposit.service';
import { WithdrawalService } from './withdrawal.service';
import { PaymentCallbackService } from './payment-callback.service';
import { PayosService } from './payos.service';

@Controller('provider-wallets')
@ApiTags('provider-wallets')
@ApiErrorResponses()
export class ProviderWalletsController {
  constructor(
    private readonly walletAccountService: WalletAccountService,
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
    private readonly paymentCallbackService: PaymentCallbackService,
    private readonly payosService: PayosService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get provider wallet balance' })
  @ApiBearerAuth()
  @ApiSuccessResponse('Wallet balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getBalance(@CurrentUser('id') userId: number) {
    return this.walletAccountService.getBalance(userId);
  }

  @Get('history')
  @ApiQuery({ name: 'type', enum: WalletTransactionType, required: false })
  @ApiSuccessResponse('Wallet transaction history')
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
  @ApiOperation({ summary: 'Create VNPay wallet deposit request' })
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 requests per minute
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async deposit(
    @CurrentUser('id') userId: number,
    @Body() body: DepositRequestDto,
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
    return this.depositService.createDepositRequest(userId, body.amount, ip);
  }

  @Post('manual-deposits')
  @ApiOperation({ summary: 'Create manual wallet deposit request' })
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 requests per minute
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async createManualDeposit(
    @CurrentUser('id') userId: number,
    @Body() body: ManualDepositRequestDto,
  ) {
    return this.depositService.createManualDepositRequest(
      userId,
      body.amount,
      body.transferCode,
      body.receiptUrl,
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
  @ApiOperation({ summary: 'Create wallet withdrawal request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async createWithdrawal(
    @CurrentUser('id') userId: number,
    @Body() body: CreateWithdrawalRequestDto,
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

  /** PayOS Deposit Link Creation */
  @Post('payos/deposit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async createPayosDeposit(
    @CurrentUser('id') userId: number,
    @Body('amount', ParseIntPipe) amount: number,
  ) {
    return this.payosService.createDepositRequest(userId, amount);
  }

  /** PayOS Webhook */
  @Post('payos/webhook')
  @SkipThrottle()
  async handlePayosWebhook(@Body() body: any) {
    return this.payosService.verifyWebhook(body);
  }
}

@Controller('admin/wallet-deposits')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.WALLET_DEPOSIT_MANAGE)
@ApiTags('admin-wallet-deposits')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminWalletDepositsController {
  constructor(private readonly depositService: DepositService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: WalletRequestStatus, required: false })
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
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: AdminWalletActionDto,
  ) {
    return this.depositService.adminApproveManualDeposit(
      adminId,
      id,
      body?.note,
    );
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: AdminWalletActionDto,
  ) {
    return this.depositService.adminRejectManualDeposit(
      adminId,
      id,
      body?.note,
    );
  }
}

@Controller('admin/wallet-withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.WALLET_WITHDRAWAL_MANAGE)
@ApiTags('admin-wallet-withdrawals')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminWalletWithdrawalsController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: WalletRequestStatus, required: false })
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
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: AdminWalletActionDto,
  ) {
    return this.withdrawalService.adminApproveWithdrawal(
      adminId,
      id,
      body?.note,
    );
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: AdminWalletActionDto,
  ) {
    return this.withdrawalService.adminRejectWithdrawal(
      adminId,
      id,
      body?.note,
    );
  }
}
