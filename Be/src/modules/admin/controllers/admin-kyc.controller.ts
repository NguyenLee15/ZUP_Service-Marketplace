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
import { AdminReasonDto, AdminStatusListQueryDto } from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-kyc')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminKycController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Permissions(AdminPermission.KYC_VIEW)
  @ApiOperation({ summary: 'List provider KYC requests' })
  async getKycRequests(@Query() query: AdminStatusListQueryDto) {
    return this.adminService.getKycRequests(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @Permissions(AdminPermission.KYC_VIEW)
  @ApiOperation({ summary: 'Get KYC request detail by ID' })
  async getKycRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getKycRequestById(id);
  }

  @Patch(':id/approve')
  @Permissions(AdminPermission.KYC_APPROVE)
  @ApiOperation({ summary: 'Approve provider KYC' })
  async approveKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'APPROVE', undefined, ip);
  }

  @Patch(':id/reject')
  @Permissions(AdminPermission.KYC_REJECT)
  @ApiOperation({ summary: 'Reject provider KYC with reason' })
  async rejectKyc(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
    @Ip() ip: string,
  ) {
    return this.adminService.reviewKyc(adminId, id, 'REJECT', body.reason, ip);
  }
}
