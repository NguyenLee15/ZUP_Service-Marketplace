import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';
import { ServiceSharedService } from './service-shared.service';

@Injectable()
export class ServiceCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly shared: ServiceSharedService,
  ) {}

  async create(
    providerId: number,
    dto: CreateServiceDto,
    files?: Express.Multer.File[],
  ) {
    await this.shared.checkActiveUser(providerId);
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category || category.isDeleted) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Danh mục không tồn tại',
      });
    }

    const service = await this.prisma.$transaction(async (tx) => {
      const createdService = await tx.service.create({
        data: {
          providerId,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          referencePrice: dto.referencePrice,
          status: ServiceStatus.DRAFT,
        },
      });

      if (dto.items && dto.items.length > 0) {
        const serviceItems = dto.items.map((item) => ({
          serviceId: createdService.id,
          name: item.name,
          unit: item.unit,
          price: item.price,
        }));
        await tx.serviceItem.createMany({ data: serviceItems });
      }

      return createdService;
    });

    if (files && files.length > 0) {
      const images = await Promise.all(
        files.map(async (file, index) => {
          const uploaded = await this.cloudinaryService.uploadFile(
            file.buffer,
            'services',
          );
          return {
            serviceId: service.id,
            imageUrl: uploaded.url,
            cloudinaryId: uploaded.publicId,
            displayOrder: index,
          };
        }),
      );
      await this.prisma.serviceImage.createMany({ data: images });
    }

    const serviceWithItems = await this.prisma.service.findUnique({
      where: { id: service.id },
      include: {
        items: true,
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return {
      data: serviceWithItems,
      message: 'Tạo dịch vụ nháp thành công',
    };
  }

  async update(
    providerId: number,
    serviceId: number,
    dto: UpdateServiceDto,
    files?: Express.Multer.File[],
  ) {
    await this.shared.checkActiveUser(providerId);
    const service = await this.shared.checkOwnership(serviceId, providerId);

    const updateData: Prisma.ServiceUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.categoryId)
      updateData.category = { connect: { id: dto.categoryId } };
    if (dto.referencePrice) updateData.referencePrice = dto.referencePrice;

    if (
      service.status === ServiceStatus.ACTIVE ||
      service.status === ServiceStatus.REJECTED
    ) {
      updateData.status = ServiceStatus.PENDING;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedService = await tx.service.update({
        where: { id: serviceId },
        data: updateData,
      });

      if (dto.items) {
        // Delete all old service items and insert new ones
        await tx.serviceItem.deleteMany({
          where: { serviceId },
        });

        if (dto.items.length > 0) {
          const serviceItems = dto.items.map((item) => ({
            serviceId,
            name: item.name,
            unit: item.unit,
            price: item.price,
          }));
          await tx.serviceItem.createMany({ data: serviceItems });
        }
      }

      return updatedService;
    });

    if (files && files.length > 0) {
      const currentImages = await this.prisma.serviceImage.count({
        where: { serviceId },
      });

      const images = await Promise.all(
        files.map(async (file, index) => {
          const uploaded = await this.cloudinaryService.uploadFile(
            file.buffer,
            'services',
          );
          return {
            serviceId,
            imageUrl: uploaded.url,
            cloudinaryId: uploaded.publicId,
            displayOrder: currentImages + index,
          };
        }),
      );
      await this.prisma.serviceImage.createMany({ data: images });
    }

    if (updateData.status === ServiceStatus.PENDING) {
      await this.shared.notifyAdmins(
        'SERVICE_UPDATED',
        'Dịch vụ cần duyệt lại',
        `Dịch vụ "${updated.name}" đã được cập nhật và cần duyệt lại`,
        serviceId,
      );
    }

    const serviceWithItems = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        items: true,
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return { data: serviceWithItems, message: 'Cập nhật dịch vụ thành công' };
  }

  async submit(providerId: number, serviceId: number) {
    const service = await this.shared.checkOwnership(serviceId, providerId);

    if (service.status !== ServiceStatus.DRAFT) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể gửi duyệt dịch vụ ở trạng thái Nháp',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.PENDING },
    });

    await this.shared.notifyAdmins(
      'NEW_SERVICE',
      'Dịch vụ mới cần duyệt',
      `Nhà cung cấp #${providerId} đã gửi dịch vụ "${service.name}" để duyệt`,
      serviceId,
    );

    return { data: updated, message: 'Đã gửi dịch vụ để duyệt' };
  }

  async hide(providerId: number, serviceId: number) {
    const service = await this.shared.checkOwnership(serviceId, providerId);

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

    return { data: updated, message: 'Đã ẩn dịch vụ' };
  }

  async show(providerId: number, serviceId: number) {
    const service = await this.shared.checkOwnership(serviceId, providerId);

    if (service.status !== ServiceStatus.HIDDEN) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể hiện dịch vụ đang ẩn',
      });
    }

    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });
    if (wallet?.isRestricted) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Ví của bạn đang bị hạn chế. Vui lòng nạp tiền trước.',
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ACTIVE },
    });

    return { data: updated, message: 'Đã hiện dịch vụ' };
  }

  async getMyServices(providerId: number, status?: string) {
    const where: Prisma.ServiceWhereInput = { providerId, isDeleted: false };
    if (this.shared.isServiceStatus(status)) where.status = status;

    const services = await this.prisma.service.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { displayOrder: 'asc' } },
        items: true,
      },
      orderBy: { id: 'desc' },
    });

    return { data: services };
  }

  async deleteByProvider(providerId: number, serviceId: number) {
    const service = await this.shared.checkOwnership(serviceId, providerId);

    if (
      !(
        [ServiceStatus.DRAFT, ServiceStatus.HIDDEN] as ServiceStatus[]
      ).includes(service.status)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Chỉ có thể xóa dịch vụ ở trạng thái Nháp hoặc Đã ẩn',
      });
    }

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { isDeleted: true },
    });

    return { message: 'Đã xóa dịch vụ' };
  }
}
