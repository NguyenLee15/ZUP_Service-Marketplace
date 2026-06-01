import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

type NotificationPrismaMock = {
  notification: {
    findMany: jest.Mock;
    count: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: NotificationPrismaMock;

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('filters notifications by owner, read state, and type', async () => {
    await service.getAll(10, {
      page: 2,
      limit: 5,
      isRead: false,
      type: 'BOOKING',
    });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 10, isRead: false, type: 'BOOKING' },
        skip: 5,
        take: 5,
      }),
    );
    expect(prisma.notification.count).toHaveBeenNthCalledWith(1, {
      where: { userId: 10, isRead: false, type: 'BOOKING' },
    });
  });

  it('deletes only notification owned by current user', async () => {
    await service.delete(10, 99);

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: 99, userId: 10 },
    });
  });

  it('rejects deleting a notification that does not belong to user', async () => {
    prisma.notification.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.delete(10, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
