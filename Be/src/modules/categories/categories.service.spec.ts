import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CategoriesService } from './categories.service';

type CategoriesPrismaMock = {
  serviceCategory: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  service: {
    count: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: CategoriesPrismaMock;
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    prisma = {
      serviceCategory: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      service: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    service = new CategoriesService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  describe('create', () => {
    it('creates a category and records an audit log when adminId is provided', async () => {
      prisma.serviceCategory.findFirst.mockResolvedValue(null);
      prisma.serviceCategory.create.mockResolvedValue({
        id: 10,
        name: 'Sửa chữa điện tử',
        description: 'Mô tả',
      });

      const result = await service.create(1, '127.0.0.1', {
        name: 'Sửa chữa điện tử',
        description: 'Mô tả',
      });

      expect(result.data.id).toBe(10);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'CREATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: 10,
          description: 'Tạo danh mục: Sửa chữa điện tử',
          ipAddress: '127.0.0.1',
        },
      });
      expect(redis.del).toHaveBeenCalled();
    });

    it('throws BadRequestException if category name already exists', async () => {
      prisma.serviceCategory.findFirst.mockResolvedValue({
        id: 5,
        name: 'Điện',
      });

      await expect(
        service.create(1, '127.0.0.1', { name: 'Điện' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates category and records audit log', async () => {
      prisma.serviceCategory.findUnique.mockResolvedValue({
        id: 10,
        name: 'Điện cũ',
        isDeleted: false,
      });
      prisma.serviceCategory.update.mockResolvedValue({
        id: 10,
        name: 'Điện mới',
      });

      const result = await service.update(2, '192.168.1.1', 10, {
        name: 'Điện mới',
      });

      expect(result.data.name).toBe('Điện mới');
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 2,
          action: 'UPDATE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: 10,
          description: 'Cập nhật danh mục: Điện mới',
          ipAddress: '192.168.1.1',
        },
      });
    });

    it('throws NotFoundException if category does not exist', async () => {
      prisma.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.update(2, '192.168.1.1', 99, { name: 'Mới' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('soft deletes category and records audit log if no active services exist', async () => {
      prisma.serviceCategory.findUnique.mockResolvedValue({
        id: 10,
        name: 'Gia dụng',
        isDeleted: false,
      });
      prisma.service.count.mockResolvedValue(0);

      const result = await service.softDelete(1, '10.0.0.1', 10);

      expect(result.message).toBe('Xóa danh mục thành công');
      expect(prisma.serviceCategory.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { isDeleted: true },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          action: 'DELETE_CATEGORY',
          targetType: 'CATEGORY',
          targetId: 10,
          description: 'Xóa danh mục: Gia dụng',
          ipAddress: '10.0.0.1',
        },
      });
    });

    it('throws BadRequestException if category has active services', async () => {
      prisma.serviceCategory.findUnique.mockResolvedValue({
        id: 10,
        name: 'Gia dụng',
        isDeleted: false,
      });
      prisma.service.count.mockResolvedValue(3);

      await expect(
        service.softDelete(1, '10.0.0.1', 10),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
