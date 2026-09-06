import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminPermission } from '../../common/constants/admin-permissions';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** GET /categories/tree — public, cached */
  @Get('tree')
  async getTree() {
    return this.categoriesService.getTree();
  }

  /** GET /categories/flat — public */
  @Get('flat')
  async getFlat() {
    return this.categoriesService.getFlat();
  }

  /** POST /categories — Admin only */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'STAFF')
  @Permissions(AdminPermission.SERVICE_MODERATE)
  async create(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(adminId, ip, dto);
  }

  /** PATCH /categories/:id — Admin only */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'STAFF')
  @Permissions(AdminPermission.SERVICE_MODERATE)
  async update(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(adminId, ip, id, dto);
  }

  /** DELETE /categories/:id — Admin only */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'STAFF')
  @Permissions(AdminPermission.SERVICE_MODERATE)
  async softDelete(
    @CurrentUser('id') adminId: number,
    @Ip() ip: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.softDelete(adminId, ip, id);
  }
}
