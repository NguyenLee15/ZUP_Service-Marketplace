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
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../common/decorators/api-contract.decorator';
import { FeaturedListingsService } from '../featured-listings.service';
import { ProviderPublicService } from '../provider-public.service';
import { ServiceCommandService } from '../service-command.service';
import { ServiceSearchService } from '../service-search.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  SearchServiceDto,
  AiSearchDto,
  PublicProviderServicesQueryDto,
  PurchaseFeaturedListingDto,
  AiGenerateDescriptionDto,
} from '../dto/services.dto';
import { AiService } from '../../../shared/ai/ai.service';
import { ErrorCodes } from '../../../common/errors/error-codes';

@Controller('services')
@ApiTags('services')
@ApiErrorResponses()
export class ServicesController {
  constructor(
    private readonly commandService: ServiceCommandService,
    private readonly searchService: ServiceSearchService,
    private readonly providerPublicService: ProviderPublicService,
    private readonly featuredListingsService: FeaturedListingsService,
    private readonly aiService: AiService,
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
  @Get('ai-state')
  async getAiState() {
    return this.searchService.getAiState();
  }

  @Post('ai-test')
  async testAiSearch(@Body() dto: AiSearchDto) {
    return this.searchService.testAiSearch(dto.query);
  }

  @Post('ai-search')
  @HttpCode(200)
  async aiSearch(@Body() dto: AiSearchDto) {
    return this.searchService.aiSearch(dto.query, dto.lat, dto.lng);
  }

  /** GET /services/:id — public detail */
  @Get(':id')
  async getPublicDetail(@Param('id', ParseIntPipe) id: number) {
    return this.providerPublicService.getPublicDetail(id);
  }

  /** GET /services/:id/reviews */
  @Get(':id/reviews')
  async getReviews(
    @Param('id', ParseIntPipe) serviceId: number,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.providerPublicService.getServiceReviews(
      serviceId,
      rating ? parseInt(rating, 10) : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /** GET /services/:id/provider-stats — chỉ số hiệu suất NCC */
  @Get(':id/provider-stats')
  async getProviderStats(@Param('id', ParseIntPipe) serviceId: number) {
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

  /** POST /services/ai-generate-description - Sinh mô tả dịch vụ bằng AI */
  @Post('ai-generate-description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Provider sinh mô tả dịch vụ tự động bằng AI',
  })
  @ApiSuccessResponse('Sinh mô tả thành công')
  async generateDescription(@Body() dto: AiGenerateDescriptionDto) {
    const text = await this.aiService.generateServiceDescription(
      dto.name,
      dto.keywords,
    );
    if (!text) {
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Hệ thống AI đang bận, vui lòng thử lại sau',
      });
    }
    return { success: true, data: text };
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

