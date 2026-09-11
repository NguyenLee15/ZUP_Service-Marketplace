import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { ServiceModerationService } from '../service-moderation.service';
import {
  AdminServicesQueryDto,
  AdminRejectDto,
  AdminHideDto,
} from '../dto/services.dto';

// ===== Admin Controller — /admin/services =====

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.SERVICE_MODERATE)
@ApiTags('admin-services')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminServicesController {
  constructor(private readonly moderationService: ServiceModerationService) {}

  /** GET /admin/services */
  @Get()
  @ApiOperation({ summary: 'Admin lists services for moderation' })
  async getAll(@Query() query: AdminServicesQueryDto) {
    return this.moderationService.getAll(query);
  }

  /** PATCH /admin/services/:id/approve */
  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.moderationService.approve(adminId, id, ip);
  }

  /** PATCH /admin/services/:id/reject */
  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminRejectDto,
  ) {
    return this.moderationService.reject(adminId, id, dto.reason, ip);
  }

  /** PATCH /admin/services/:id/hide — Admin ẩn vi phạm */
  @Patch(':id/hide')
  async adminHide(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminHideDto,
  ) {
    return this.moderationService.hide(adminId, id, dto.reason, ip);
  }

  /** PATCH /admin/services/:id/unhide — Admin bỏ ẩn */
  @Patch(':id/unhide')
  async adminUnhide(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.moderationService.show(adminId, id, ip);
  }
}

