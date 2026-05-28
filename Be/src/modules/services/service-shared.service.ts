import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServiceSharedService {
  constructor(private readonly prisma: PrismaService) {}

  async checkActiveUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, status: 'ACTIVE' },
    });
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản của bạn đã bị khóa hoặc không tồn tại',
      });
    }
    return user;
  }

  async checkOwnership(serviceId: number, providerId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, providerId, isDeleted: false },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại hoặc bạn không có quyền',
      });
    }
    return service;
  }

  isServiceStatus(value: unknown): value is ServiceStatus {
    return (
      typeof value === 'string' &&
      Object.values(ServiceStatus).includes(value as ServiceStatus)
    );
  }

  async notifyAdmins(
    type: string,
    title: string,
    content: string,
    refId: number,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type,
          title,
          content,
          referenceId: refId,
        })),
      });
    }
  }
}
