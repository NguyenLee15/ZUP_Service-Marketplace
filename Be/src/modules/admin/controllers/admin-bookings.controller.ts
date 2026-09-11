import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Body,
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
import { AdminBookingsQueryDto, AdminReasonDto } from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';
import { BookingQueryService } from '../../bookings/booking-query.service';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiTags('admin-bookings')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminBookingsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bookingQueryService: BookingQueryService,
  ) {}

  @Get()
  @Permissions(AdminPermission.BOOKING_VIEW)
  @ApiOperation({ summary: 'List bookings with status filter for admin/staff' })
  async getBookings(@Query() query: AdminBookingsQueryDto) {
    return this.adminService.getBookings(
      query.status,
      query.keyword,
      query.page,
      query.limit,
    );
  }

  @Get(':id/timeline')
  @Permissions(AdminPermission.BOOKING_VIEW)
  @ApiOperation({ summary: 'Get booking status timeline for admin/staff' })
  async getBookingTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.bookingQueryService.getTimelineForAdmin(id);
  }

  @Get(':id')
  @Permissions(AdminPermission.BOOKING_VIEW)
  @ApiOperation({ summary: 'Get booking detail for admin/staff' })
  async getBookingDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getBookingDetail(id);
    return { data };
  }

  @Patch(':id/cancel')
  @Permissions(AdminPermission.BOOKING_CANCEL)
  @ApiOperation({ summary: 'Admin cancel booking with reason' })
  async cancelBooking(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminReasonDto,
  ) {
    return this.adminService.cancelBooking(adminId, id, body.reason);
  }
}
