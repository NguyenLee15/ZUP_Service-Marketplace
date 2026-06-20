import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminPermission } from '../../common/constants/admin-permissions';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/decorators/api-contract.decorator';
import { FeaturedListingsService } from './featured-listings.service';
import { ProviderPublicService } from './provider-public.service';
import { ServiceCommandService } from './service-command.service';
import { ServiceModerationService } from './service-moderation.service';
import { ServiceSearchService } from './service-search.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  SearchServiceDto,
  AdminRejectDto,
  AdminHideDto,
  AiSearchDto,
  AdminServicesQueryDto,
  PublicProviderServicesQueryDto,
  PurchaseFeaturedListingDto,
  AdminFeaturedListingsQueryDto,
  UpdateFeaturedRateDto,
} from './dto/services.dto';

@Controller('services')
@ApiTags('services')
@ApiErrorResponses()
export class ServicesController {
  constructor(
    private readonly commandService: ServiceCommandService,
    private readonly searchService: ServiceSearchService,
    private readonly providerPublicService: ProviderPublicService,
    private readonly featuredListingsService: FeaturedListingsService,
  ) {}

  // ===== PUBLIC =====

  /** GET /services/featured — danh sách dịch vụ nổi bật */
  @Get('featured')
  async getFeatured() {
    return this.featuredListingsService.getActiveFeatured(8);
  }

  /** GET /services/search */
  @Get('search')
  @ApiOperation({ summary: 'Search public services' })
  @ApiSuccessResponse('Service search results')
  async search(@Query() dto: SearchServiceDto) {
    return this.searchService.search(dto);
  }

  /** POST /services/ai-search */
  @Post('ai-search')
  async aiSearch(@Body() dto: AiSearchDto) {
    return this.searchService.aiSearch(dto.query);
  }

  /** GET /services/:id — public detail */
  @Get(':id')
  async getPublicDetail(@Param('id', ParseIntPipe) id: number) {
    return this.providerPublicService.getPublicDetail(id);
  }

  /** GET /services/:id/reviews */
  @Get(':id/reviews')
  async getReviews(@Param('id', ParseIntPipe) serviceId: number) {
    return this.providerPublicService.getPublicDetail(serviceId);
  }

  /** GET /services/:id/provider-stats — chỉ số hiệu suất NCC */
  @Get(':id/provider-stats')
  async getProviderStats(@Param('id', ParseIntPipe) serviceId: number) {
    // Lấy providerId từ service
    const detail = await this.providerPublicService.getPublicDetail(serviceId);
    const providerId = detail.data.providerId;
    return this.providerPublicService.getProviderMetrics(providerId);
  }

  /** GET /services/providers/:id — thông tin cá nhân công khai NCC */
  @Get('providers/:id')
  async getPublicProviderProfile(@Param('id', ParseIntPipe) id: number) {
    return this.providerPublicService.getPublicProviderProfile(id);
  }

  /** GET /services/providers/:id/services — danh sách dịch vụ của thợ */
  @Get('providers/:id/services')
  async getPublicProviderServices(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PublicProviderServicesQueryDto,
  ) {
    return this.providerPublicService.getPublicProviderServices(id, query);
  }

  // ===== PROVIDER =====

  /** GET /services/my — provider's own services */
  @Get('my/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getMyServices(
    @CurrentUser('id') providerId: number,
    @Query('status') status?: string,
  ) {
    return this.commandService.getMyServices(providerId, status);
  }

  /** POST /services — create service (provider) */
  @Post()
  @ApiOperation({ summary: 'Provider creates a service' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        referencePrice: { type: 'number' },
        items: { type: 'string', description: 'JSON service item array' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['categoryId', 'name', 'description', 'referencePrice'],
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @CurrentUser('id') providerId: number,
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.commandService.create(providerId, dto, files);
  }

  /** PATCH /services/:id — update service (provider) */
  @Patch(':id')
  @ApiOperation({ summary: 'Provider updates a service' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        referencePrice: { type: 'number' },
        items: { type: 'string', description: 'JSON service item array' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.commandService.update(providerId, id, dto, files);
  }

  /** PATCH /services/:id/submit — DRAFT → PENDING */
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async submit(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.submit(providerId, id);
  }

  /** PATCH /services/:id/hide — ACTIVE → HIDDEN */
  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async hide(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.hide(providerId, id);
  }

  /** PATCH /services/:id/show — HIDDEN → ACTIVE */
  @Patch(':id/show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async show(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.show(providerId, id);
  }

  /** DELETE /services/:id — UC05.4 Provider xóa dịch vụ */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async deleteByProvider(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.deleteByProvider(providerId, id);
  }

  /** POST /services/:id/feature — NCC mua featured listing */
  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async purchaseFeature(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) serviceId: number,
    @Body() dto: PurchaseFeaturedListingDto,
  ) {
    return this.featuredListingsService.purchaseFeaturedListing(
      providerId,
      serviceId,
      dto.days,
    );
  }

  /** GET /services/my/featured — NCC xem featured listings của mình */
  @Get('my/featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async getMyFeatured(@CurrentUser('id') providerId: number) {
    return this.featuredListingsService.getMyFeaturedListings(providerId);
  }
}

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
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.moderationService.approve(adminId, id);
  }

  /** PATCH /admin/services/:id/reject */
  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminRejectDto,
  ) {
    return this.moderationService.reject(adminId, id, dto.reason);
  }

  /** PATCH /admin/services/:id/hide */
  @Patch(':id/hide')
  async hide(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminHideDto,
  ) {
    return this.moderationService.hide(adminId, id, dto.reason);
  }

  /** DELETE /admin/services/:id — UC05.4 Admin xóa dịch vụ */
  @Delete(':id')
  async deleteByAdmin(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.moderationService.delete(adminId, id);
  }
}

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
