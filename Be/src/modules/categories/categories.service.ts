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
import { Prisma } from '@prisma/client';

const CACHE_KEY = 'categories:tree';
const CACHE_TTL = 600; // 10 phút

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger('CategoriesService');

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getTree() {
    const cached = await this.redisService.get(CACHE_KEY);
    if (cached) {
      return { data: this.parseCategoryTree(cached) };
    }

    const categories = await this.prisma.serviceCategory.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });

    const tree = this.buildTree(categories, null);
    await this.redisService.set(CACHE_KEY, JSON.stringify(tree), CACHE_TTL);

    return { data: tree };
  }

  async getFlat() {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isDeleted: false },
      orderBy: [{ parentId: 'asc' }, { id: 'asc' }],
    });
    return { data: categories };
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: {
        name: dto.name,
        parentId: dto.parentId || null,
        isDeleted: false,
      },
    });
    if (existing) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Tên danh mục đã tồn tại ở cùng cấp',
      });
    }

    if (dto.parentId) {
      const depth = await this.getDepth(dto.parentId);
      if (depth >= 3) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Danh mục không được quá 3 cấp',
        });
      }
    }

    const level = dto.parentId ? (await this.getDepth(dto.parentId)) + 1 : 1;

    const category = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId || null,
        level,
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

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Không thể đặt danh mục làm cha của chính nó',
        });
      }
      const descendants = await this.getDescendantIds(id);
      if (descendants.includes(dto.parentId)) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Không thể tạo vòng tham chiếu danh mục',
        });
      }
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId !== undefined ? dto.parentId : undefined,
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

    const children = await this.prisma.serviceCategory.count({
      where: { parentId: id, isDeleted: false },
    });
    if (children > 0) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Không thể xóa danh mục có chứa danh mục con',
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

  // ===== HELPERS =====

  private buildTree(
    categories: Prisma.ServiceCategoryGetPayload<object>[],
    parentId: number | null,
  ): CategoryTreeNode[] {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => ({ ...c, children: this.buildTree(categories, c.id) }));
  }

  private async getDepth(categoryId: number): Promise<number> {
    let depth = 1;
    let current = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });
    while (current?.parentId) {
      depth++;
      current = await this.prisma.serviceCategory.findUnique({
        where: { id: current.parentId },
      });
    }
    return depth;
  }

  private async getDescendantIds(categoryId: number): Promise<number[]> {
    const ids: number[] = [];
    const children = await this.prisma.serviceCategory.findMany({
      where: { parentId: categoryId, isDeleted: false },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(child.id);
      ids.push(...(await this.getDescendantIds(child.id)));
    }
    return ids;
  }

  private async invalidateCache() {
    await this.redisService.del(CACHE_KEY);
  }

  private parseCategoryTree(raw: string): CategoryTreeNode[] {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CategoryTreeNode[]) : [];
  }
}

type CategoryTreeNode = Prisma.ServiceCategoryGetPayload<object> & {
  children: CategoryTreeNode[];
};
