import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { AdminAuditLogsQueryDto } from '../dto/admin.dto';
import { AdminAuditLogService } from '../services/admin-audit-log.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-audit-logs')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminAuditLogsController {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  @Get()
  @Permissions(AdminPermission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: 'List business/security audit logs' })
  @ApiQuery({ name: 'actorId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse('Audit log list')
  async getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
    return this.auditLogService.getAuditLogs(query);
  }

  @Get('export')
  @Permissions(AdminPermission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: 'Export business/security audit logs as CSV' })
  @ApiQuery({ name: 'actorId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async exportAuditLogs(
    @Query() query: AdminAuditLogsQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditLogService.exportAuditLogsCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit-logs.csv"',
    );
    return res.status(HttpStatus.OK).send(csv);
  }
}
