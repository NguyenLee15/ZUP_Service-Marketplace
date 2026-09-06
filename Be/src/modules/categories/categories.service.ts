import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

const CACHE_KEY = 'categories:list';
const CACHE_TTL = 600; // 10 phút

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger('CategoriesService');

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getFlat() {
    const cached = await this.redisService.get(CACHE_KEY);
    if (cached) {
      return { data: JSON.parse(cached) };
    }

    const categories = await this.prisma.serviceCategory.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });

    await this.redisService.set(
      CACHE_KEY,
      JSON.stringify(categories),
      CACHE_TTL,
    );
    return { data: categories };
  }

  // Alias for backward compatibility (formerly getTree)
  async getTree() {
    return this.getFlat();
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: {
        name: dto.name,
        isDeleted: false,
      },
    });
    if (existing) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Tên danh mục đã tồn tại',
      });
    }

    const category = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    await this.invalidateCache();
    return { data: category, message: 'Tạo danh mục thành công' };
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!category || category.isDeleted) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Danh mục không tồn tại',
      });
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    await this.invalidateCache();
    return { data: updated, message: 'Cập nhật danh mục thành công' };
  }

  async softDelete(id: number) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!category || category.isDeleted) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Danh mục không tồn tại',
      });
    }

    const services = await this.prisma.service.count({
      where: { categoryId: id, isDeleted: false },
    });
    if (services > 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Không thể xóa danh mục đang có dịch vụ',
      });
    }

    await this.prisma.serviceCategory.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.invalidateCache();
    return { message: 'Xóa danh mục thành công' };
  }

  private async invalidateCache() {
    await this.redisService.del(CACHE_KEY);
    // Remove old cache key if it exists
    await this.redisService.del('categories:tree');
  }
}
