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
import { WalletLedgerService } from '../provider-wallets/wallet-ledger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ServiceCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly shared: ServiceSharedService,
    private readonly ledger: WalletLedgerService,
    private readonly eventEmitter: EventEmitter2,
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

    const uploadedImages: Array<{
      imageUrl: string;
      cloudinaryId: string;
      displayOrder: number;
    }> = [];
    try {
      for (const [index, file] of (files ?? []).entries()) {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'services',
        );
        uploadedImages.push({
          imageUrl: uploaded.url,
          cloudinaryId: uploaded.publicId,
          displayOrder: index,
        });
      }
    } catch (error) {
      await Promise.all(
        uploadedImages.map((image) =>
          this.cloudinaryService.deleteFile(image.cloudinaryId),
        ),
      );
      throw error;
    }

    const service = await this.prisma
      .$transaction(async (tx) => {
        const createdService = await tx.service.create({
          data: {
            providerId,
            categoryId: dto.categoryId,
            name: dto.name,
            description: dto.description,
            referencePrice: dto.items?.length
              ? Math.min(...dto.items.map((i) => Number(i.price)))
              : 0,
            status: ServiceStatus.PENDING,
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

        if (uploadedImages.length > 0) {
          await tx.serviceImage.createMany({
            data: uploadedImages.map((image) => ({
              ...image,
              serviceId: createdService.id,
            })),
          });
        }

        return createdService;
      })
      .catch(async (error) => {
        await Promise.all(
          uploadedImages.map((image) =>
            this.cloudinaryService.deleteFile(image.cloudinaryId),
          ),
        );
        throw error;
      });

    await this.shared.notifyAdmins(
      'SERVICE_CREATED',
      'Dịch vụ mới cần duyệt',
      `Nhà cung cấp #${providerId} đã tạo dịch vụ mới`,
      service.id,
    );

    const serviceWithItems = await this.prisma.service.findUnique({
      where: { id: service.id },
      include: {
        items: true,
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return {
      data: serviceWithItems,
      message: 'Tạo dịch vụ thành công, đang chờ duyệt',
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

    if (dto.items && dto.items.length > 0) {
      updateData.referencePrice = Math.min(
        ...dto.items.map((i) => Number(i.price)),
      );
    } else if (dto.referencePrice) {
      updateData.referencePrice = dto.referencePrice;
    }

    if (
      service.status === ServiceStatus.ACTIVE ||
      service.status === ServiceStatus.REJECTED ||
      service.status === ServiceStatus.DRAFT ||
      service.status === ServiceStatus.HIDDEN
    ) {
      updateData.status = ServiceStatus.PENDING;
    }

    const currentImages = files?.length
      ? await this.prisma.serviceImage.count({ where: { serviceId } })
      : 0;
    const uploadedImages: Array<{
      imageUrl: string;
      cloudinaryId: string;
      displayOrder: number;
    }> = [];
    try {
      for (const [index, file] of (files ?? []).entries()) {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'services',
        );
        uploadedImages.push({
          imageUrl: uploaded.url,
          cloudinaryId: uploaded.publicId,
          displayOrder: currentImages + index,
        });
      }
    } catch (error) {
      await Promise.all(
        uploadedImages.map((image) =>
          this.cloudinaryService.deleteFile(image.cloudinaryId),
        ),
      );
      throw error;
    }

    const updated = await this.prisma
      .$transaction(async (tx) => {
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

        if (uploadedImages.length > 0) {
          await tx.serviceImage.createMany({
            data: uploadedImages.map((image) => ({ ...image, serviceId })),
          });
        }

        return updatedService;
      })
      .catch(async (error) => {
        await Promise.all(
          uploadedImages.map((image) =>
            this.cloudinaryService.deleteFile(image.cloudinaryId),
          ),
        );
        throw error;
      });

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

    await this.ledger.syncWalletRestriction(providerId, this.prisma);

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

    await this.ledger.syncWalletRestriction(providerId, this.prisma);
    this.eventEmitter.emit('cache.clear.services');

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

    const activeServices = await this.prisma.service.findMany({
      where: { providerId, status: 'ACTIVE', isDeleted: false },
      select: { referencePrice: true },
    });

    const wallet = await this.prisma.providerWallet.findUnique({
      where: { providerId },
    });

    // Add the current service's price since we are about to activate it
    const sumReferencePrice =
      activeServices.reduce((sum, s) => sum + Number(s.referencePrice), 0) +
      Number(service.referencePrice);

    // Get commission rate
    let rate = 8.5;
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'commission_rate' },
    });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as { rate?: unknown };
        if (typeof parsed.rate === 'number') rate = parsed.rate;
      } catch {
        // use default fallback rate
      }
    } else {
      const commissionConfig = await this.prisma.commissionConfig.findFirst({
        orderBy: { effectiveFrom: 'desc' },
      });
      if (commissionConfig) rate = Number(commissionConfig.rate);
    }

    const requiredDeposit = (sumReferencePrice * rate) / 100;
    const balanceNum = wallet ? Number(wallet.balance) : 0;

    if (balanceNum < requiredDeposit) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: `Bạn cần có số dư ví tối thiểu ${requiredDeposit.toLocaleString('vi-VN')}đ để bật hoạt động dịch vụ này (do tổng giá trị dịch vụ đang hoạt động). Vui lòng nạp thêm tiền.`,
      });
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ACTIVE },
    });

    await this.ledger.syncWalletRestriction(providerId, this.prisma);
    this.eventEmitter.emit('cache.clear.services');

    return { data: updated, message: 'Đã hiện dịch vụ' };
  }

  async getMyServices(
    providerId: number,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 50);
    const where: Prisma.ServiceWhereInput = { providerId, isDeleted: false };
    if (this.shared.isServiceStatus(status)) where.status = status;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          referencePrice: true,
          status: true,
          category: { select: { id: true, name: true } },
          images: {
            select: { id: true, imageUrl: true, displayOrder: true },
            orderBy: { displayOrder: 'asc' },
          },
          items: {
            select: { id: true, name: true, unit: true, price: true },
          },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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

    await this.ledger.syncWalletRestriction(providerId, this.prisma);
    this.eventEmitter.emit('cache.clear.services');

    return { message: 'Đã xóa dịch vụ' };
  }
}
