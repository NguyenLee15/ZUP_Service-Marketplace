import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Body,
  Ip,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole, WalletRequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import {
  AdminWalletActionDto,
  AdminWalletRequestQueryDto,
} from '../dto/wallet-query.dto';
import { DepositService } from '../deposit.service';

@Controller('admin/wallet-deposits')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
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
    @Ip() ip?: string,
  ) {
    return this.depositService.adminApproveManualDeposit(
      adminId,
      id,
      body?.note,
      ip,
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
