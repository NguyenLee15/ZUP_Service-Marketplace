import {
  Controller,
  Patch,
  Body,
  Param,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { ApiErrorResponses } from '../../../common/decorators/api-contract.decorator';
import { BookingDisputeService } from '../booking-dispute.service';
import { ResolveDisputeDto } from '../dto/bookings.dto';

/**
 * @deprecated
 * ROUTE SHADOWING PREVENTED:
 * Route PATCH /admin/disputes/:id/resolve is now exclusively handled by
 * AdminDisputesController in AdminModule (modules/admin/controllers/).
 */
export class DeprecatedAdminDisputesController {
  constructor(private readonly bookingDisputeService: BookingDisputeService) {}

  /** PATCH /admin/disputes/:id/resolve */
  @Patch(':id/resolve')
  async resolve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      req.ip ||
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
      '';
    return this.bookingDisputeService.resolveDispute(adminId, id, dto, ip);
  }
}
