import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginationMeta } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/errors/error-codes';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    type: string,
    title: string,
    content: string,
    referenceId?: number,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, content, referenceId },
    });
  }

  async getAll(userId: number, query: NotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.type) where.type = query.type;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      meta: { ...paginationMeta(total, page, limit), unreadCount },
    };
  }

  async markRead(userId: number, notificationId: number) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { message: 'Đã đánh dấu đã đọc' };
  }

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { data: { count } };
  }

  async delete(userId: number, notificationId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Thông báo không tồn tại',
      });
    }

    return { message: 'Đã xóa thông báo' };
  }
}
