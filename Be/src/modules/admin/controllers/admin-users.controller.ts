import {
  Controller,
  Get,
  Patch,
  Delete,
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
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../common/decorators/api-contract.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { AdminReasonDto, AdminUsersQueryDto } from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-users')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Permissions(AdminPermission.USER_VIEW)
  @ApiOperation({ summary: 'List users for admin/staff' })
  @ApiSuccessResponse('Admin user list')
  async getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(
      query.page,
      query.limit,
      query.role,
      query.status,
      query.keyword,
    );
  }

  @Patch(':id/lock')
  @Permissions(AdminPermission.USER_LOCK)
  async lockUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
    @Ip() ip: string,
  ) {
    await this.adminService.lockUser(adminId, id, body.reason, ip);
    return { message: 'Đã khóa tài khoản và thu hồi toàn bộ phiên đăng nhập' };
  }

  @Patch(':id/unlock')
  @Permissions(AdminPermission.USER_LOCK)
  async unlockUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    await this.adminService.unlockUser(adminId, id, ip);
    return { message: 'Đã mở khóa tài khoản' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(AdminPermission.USER_DELETE)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async deleteUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.adminService.deleteUser(adminId, id, ip);
  }
}

