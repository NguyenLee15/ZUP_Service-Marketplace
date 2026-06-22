import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { KycStatus, Prisma, ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';
import { ServiceSharedService } from './service-shared.service';

export interface AdminServiceFilters {
  status?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class ServiceModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly shared: ServiceSharedService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async approve(adminId: number, serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          include: { kycProfiles: { orderBy: { id: 'desc' }, take: 1 } },
        },
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });
    }
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Dịch vụ không ở trạng thái chờ duyệt',
      });
    }

    const kycStatus = service.provider?.kycProfiles?.[0]?.status;
    if (kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Nhà cung cấp chưa được xác minh KYC',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.HIDDEN },
    });

    await this.prisma.user.update({
      where: { id: service.providerId },
      data: { isOnline: true },
    });

    await this.jobsService.enqueue(JobName.ServiceGenerateEmbedding, {
      serviceId,
      name: service.name,
      description: service.description,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SEND, {
      userId: service.providerId,
      type: 'SERVICE_APPROVED',
      title: 'Dịch vụ đã được duyệt',
      content: `Dịch vụ "${service.name}" đã được phê duyệt. Vui lòng nạp tối thiểu 50.000đ vào ví và bật hoạt động để khách hàng có thể đặt lịch.`,
      referenceId: serviceId,
    });

    return { data: updated, message: 'Đã phê duyệt dịch vụ' };
  }

  async reject(adminId: number, serviceId: number, reason: string) {
    const service = await this.getServiceOrThrow(serviceId);
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Dịch vụ không ở trạng thái chờ duyệt',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.REJECTED },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_REJECTED',
        title: 'Dịch vụ bị từ chối',
        content: `Dịch vụ "${service.name}" bị từ chối. Lý do: ${reason}`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã từ chối dịch vụ' };
  }

  async hide(adminId: number, serviceId: number, reason = '') {
    const service = await this.getServiceOrThrow(serviceId);
    if (service.status !== ServiceStatus.ACTIVE) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể ẩn dịch vụ đang hoạt động',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.HIDDEN },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_HIDDEN',
        title: 'Dịch vụ bị ẩn bởi Admin',
        content: `Dịch vụ "${service.name}" đã bị ẩn. Lý do: ${reason}`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã ẩn dịch vụ' };
  }

  async show(adminId: number, serviceId: number) {
    const service = await this.getServiceOrThrow(serviceId);
    if (service.status !== ServiceStatus.HIDDEN) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể mở ẩn dịch vụ đang bị ẩn',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ACTIVE },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_APPROVED',
        title: 'Dịch vụ đã được hiển thị lại',
        content: `Dịch vụ "${service.name}" đã được Admin mở ẩn và hiển thị lại trên hệ thống`,
        referenceId: serviceId,
      },
    });

    return { data: updated, message: 'Đã mở ẩn dịch vụ' };
  }

  async delete(adminId: number, serviceId: number) {
    const service = await this.getServiceOrThrow(serviceId);

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { isDeleted: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'SERVICE_DELETED',
        title: 'Dịch vụ bị xóa bởi Admin',
        content: `Dịch vụ "${service.name}" đã bị Admin xóa khỏi hệ thống`,
        referenceId: serviceId,
      },
    });

    return { message: 'Đã xóa dịch vụ' };
  }

  async getAll(filters?: AdminServiceFilters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: Prisma.ServiceWhereInput = { isDeleted: false };
    if (this.shared.isServiceStatus(filters?.status))
      where.status = filters.status;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, fullName: true, email: true } },
          images: { orderBy: { displayOrder: 'asc' } },
          items: true,
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async getServiceOrThrow(serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dịch vụ không tồn tại',
      });
    }
    return service;
  }
}
