import {
  Controller,
  Get,
  Post,
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
import {
  AdminPermission,
  ADMIN_PERMISSION_GROUPS,
} from '../../../common/constants/admin-permissions';
import {
  AdminStaffsQueryDto,
  CreateStaffDto,
  UpdateStaffDto,
} from '../dto/admin.dto';
import { StaffAdminService } from '../services/staff-admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-staffs')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminStaffsController {
  constructor(private readonly staffService: StaffAdminService) {}

  @Get('permissions')
  @Permissions(AdminPermission.STAFF_VIEW)
  @ApiOperation({ summary: 'List available staff permissions grouped for UI' })
  @ApiSuccessResponse('Admin permission groups')
  getPermissions() {
    return { data: ADMIN_PERMISSION_GROUPS };
  }

  @Get('staffs')
  @Permissions(AdminPermission.STAFF_VIEW)
  @ApiOperation({ summary: 'List admin and staff accounts' })
  async getStaffs(@Query() query: AdminStaffsQueryDto) {
    return this.staffService.getStaffs(query.page, query.limit, query.keyword);
  }

  @Post('staffs')
  @Roles(UserRole.ADMIN)
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Create staff account with permissions' })
  async createStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Body() body: CreateStaffDto,
  ) {
    const user = await this.staffService.createStaff(adminId, ip, body);
    return {
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      message: 'Tạo tài khoản nhân viên thành công',
    };
  }

  @Patch('staffs/:id')
  @Roles(UserRole.ADMIN)
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Update staff account and permissions' })
  async updateStaff(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStaffDto,
  ) {
    await this.staffService.updateStaff(adminId, ip, id, body);
    return { message: 'Đã cập nhật nhân viên' };
  }

  @Delete('staffs/:id')
  @Roles(UserRole.ADMIN)
  @Permissions(AdminPermission.STAFF_MANAGE)
  @ApiOperation({ summary: 'Soft delete staff account' })
  async deleteStaff(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    await this.staffService.deleteStaff(adminId, id, ip);
    return { message: 'Đã xóa tài khoản nhân viên (Soft delete)' };
  }
}
