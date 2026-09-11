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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import {
  AdminResolveDisputeDto,
  AdminStatusListQueryDto,
} from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-disputes')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminDisputesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Permissions(AdminPermission.DISPUTE_VIEW)
  @ApiOperation({ summary: 'List customer/provider disputes' })
  async getDisputes(@Query() query: AdminStatusListQueryDto) {
    return this.adminService.getDisputes(query.status, query.page, query.limit);
  }

  @Get(':id')
  @Permissions(AdminPermission.DISPUTE_VIEW)
  @ApiOperation({ summary: 'Get dispute detail by ID' })
  async getDisputeDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getDisputeDetail(id);
    return { data };
  }

  @Patch(':id/resolve')
  @Permissions(AdminPermission.DISPUTE_RESOLVE)
  @ApiOperation({
    summary: 'Resolve dispute with COMPLETE or PENALIZE verdict',
  })
  async resolveDispute(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResolveDisputeDto,
    @Ip() ip: string,
  ) {
    return this.adminService.resolveDispute(adminId, id, dto, ip);
  }
}
