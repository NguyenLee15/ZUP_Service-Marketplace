import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
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
import { FeaturedListingsService } from '../featured-listings.service';
import {
  AdminFeaturedListingsQueryDto,
  UpdateFeaturedRateDto,
} from '../dto/services.dto';

// ===== Admin Featured Listings — /admin/featured-listings =====

@Controller('admin/featured-listings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.SERVICE_MODERATE)
@ApiTags('admin-featured-listings')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminFeaturedListingsController {
  constructor(
    private readonly featuredListingsService: FeaturedListingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin lists featured listings' })
  async getAll(@Query() query: AdminFeaturedListingsQueryDto) {
    return this.featuredListingsService.adminListFeaturedListings(query);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Admin cancels an active featured listing' })
  async cancel(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.featuredListingsService.adminCancelFeaturedListing(adminId, id);
  }
}

// ===== Admin Featured Rate — /admin/settings/featured-rate =====

@Controller('admin/settings/featured-rate')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'STAFF')
@Permissions(AdminPermission.FINANCE_COMMISSION)
@ApiTags('admin-settings')
@ApiBearerAuth()
@ApiErrorResponses()
export class AdminFeaturedRateController {
  constructor(
    private readonly featuredListingsService: FeaturedListingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin gets featured listing daily rate' })
  async getFeaturedRate() {
    return this.featuredListingsService.getFeaturedDailyRate();
  }

  @Patch()
  @ApiOperation({ summary: 'Admin updates featured listing daily rate' })
  async updateFeaturedRate(
    @CurrentUser('id') adminId: number,
    @Body() dto: UpdateFeaturedRateDto,
  ) {
    return this.featuredListingsService.updateFeaturedDailyRate(
      adminId,
      dto.dailyRate,
    );
  }
}
