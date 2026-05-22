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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ServicesService } from './services.service';
import { FeaturedListingsService } from './featured-listings.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  SearchServiceDto,
  AdminRejectDto,
  AdminHideDto,
  AiSearchDto,
} from './dto/services.dto';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
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
  async search(@Query() dto: SearchServiceDto) {
    return this.servicesService.search(dto);
  }

  /** POST /services/ai-search */
  @Post('ai-search')
  async aiSearch(@Body() dto: AiSearchDto) {
    return this.servicesService.aiSearch(dto.query);
  }

  /** GET /services/:id — public detail */
  @Get(':id')
  async getPublicDetail(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.getPublicDetail(id);
  }

  /** GET /services/:id/reviews */
  @Get(':id/reviews')
  async getReviews(@Param('id', ParseIntPipe) serviceId: number) {
    return this.servicesService.getPublicDetail(serviceId);
  }

  /** GET /services/:id/provider-stats — chỉ số hiệu suất NCC */
  @Get(':id/provider-stats')
  async getProviderStats(@Param('id', ParseIntPipe) serviceId: number) {
    // Lấy providerId từ service
    const detail = await this.servicesService.getPublicDetail(serviceId);
    const providerId = detail.data.providerId;
    return this.servicesService.getProviderMetrics(providerId);
  }

  /** GET /services/providers/:id — thông tin cá nhân công khai NCC */
  @Get('providers/:id')
  async getPublicProviderProfile(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.getPublicProviderProfile(id);
  }

  /** GET /services/providers/:id/services — danh sách dịch vụ của thợ */
  @Get('providers/:id/services')
  async getPublicProviderServices(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.servicesService.getPublicProviderServices(id, query);
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
    return this.servicesService.getMyServices(providerId, status);
  }

  /** POST /services — create service (provider) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @CurrentUser('id') providerId: number,
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.servicesService.create(providerId, dto, files);
  }

  /** PATCH /services/:id — update service (provider) */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.servicesService.update(providerId, id, dto, files);
  }

  /** PATCH /services/:id/submit — DRAFT → PENDING */
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async submit(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.submit(providerId, id);
  }

  /** PATCH /services/:id/hide — ACTIVE → HIDDEN */
  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async hide(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.hide(providerId, id);
  }

  /** PATCH /services/:id/show — HIDDEN → ACTIVE */
  @Patch(':id/show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async show(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.show(providerId, id);
  }

  /** DELETE /services/:id — UC05.4 Provider xóa dịch vụ */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async deleteByProvider(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.deleteByProvider(providerId, id);
  }

  /** POST /services/:id/feature — NCC mua featured listing */
  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  async purchaseFeature(
    @CurrentUser('id') providerId: number,
    @Param('id', ParseIntPipe) serviceId: number,
    @Body('days') days: number,
  ) {
    return this.featuredListingsService.purchaseFeaturedListing(
      providerId,
      serviceId,
      days,
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AdminServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /** GET /admin/services */
  @Get()
  async getAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.servicesService.adminGetAll({
      status,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /** PATCH /admin/services/:id/approve */
  @Patch(':id/approve')
  async approve(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.adminApprove(adminId, id);
  }

  /** PATCH /admin/services/:id/reject */
  @Patch(':id/reject')
  async reject(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminRejectDto,
  ) {
    return this.servicesService.adminReject(adminId, id, dto.reason);
  }

  /** PATCH /admin/services/:id/hide */
  @Patch(':id/hide')
  async hide(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminHideDto,
  ) {
    return this.servicesService.adminHide(adminId, id, dto.reason);
  }

  /** DELETE /admin/services/:id — UC05.4 Admin xóa dịch vụ */
  @Delete(':id')
  async deleteByAdmin(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.deleteByAdmin(adminId, id);
  }
}
