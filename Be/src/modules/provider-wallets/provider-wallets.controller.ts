import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
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
