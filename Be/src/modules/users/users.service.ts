import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/users.dto';
import { Prisma } from '@prisma/client';

const MAX_ADDRESSES = 5;

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ===== HELPERS =====
  private async checkActiveUser(userId: number) {
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

  // ===== PROFILE =====

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycProfiles: { orderBy: { id: 'desc' }, take: 1 },
        addresses: { orderBy: { isDefault: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    const { password, ...sanitized } = user;
    void password;
    return {
      data: {
        ...sanitized,
        kycStatus: user.kycProfiles?.[0]?.status || null,
      },
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
    ip?: string,
  ) {
    await this.checkActiveUser(userId);
    const updateData: Prisma.UserUpdateInput = {};

    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone) updateData.phone = dto.phone;

    // Upload avatar nếu có
    if (avatarFile) {
      const uploaded = await this.cloudinaryService.uploadFile(
        avatarFile.buffer,
        'avatars',
      );
      updateData.avatarUrl = uploaded.url;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...sanitized } = user;
    void password;
    return {
      data: sanitized,
      message: 'Cập nhật hồ sơ thành công',
    };
  }

  async updatePushToken(userId: number, token?: string) {
    await this.checkActiveUser(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token || null },
    });
    return { message: 'Cập nhật Push Token thành công' };
  }

  async updateOnlineStatus(userId: number, isOnline: boolean) {
    const user = await this.checkActiveUser(userId);
    if (user.role !== 'PROVIDER') {
      throw new BadRequestException('Chỉ nhà cung cấp mới có thể cập nhật trạng thái này');
    }
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline },
    });
    return { message: isOnline ? 'Đã bật trạng thái nhận đơn' : 'Đã tắt trạng thái nhận đơn', isOnline };
  }

  // ===== ADDRESSES =====

  async getAddresses(userId: number) {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });

    return { data: addresses };
  }

  async createAddress(userId: number, dto: CreateAddressDto, ip?: string) {
    await this.checkActiveUser(userId);
    // Kiểm tra max 5 địa chỉ
    const count = await this.prisma.userAddress.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `Bạn chỉ được thêm tối đa ${MAX_ADDRESSES} địa chỉ`,
      });
    }

    // Nếu đặt default → unset tất cả cũ
    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Nếu là địa chỉ đầu tiên → tự động default
    const isFirst = count === 0;

    const address = await this.prisma.userAddress.create({
      data: {
        userId,
        label: dto.label,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        addressDetail: dto.addressDetail,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault || isFirst,
      },
    });

    return { data: address, message: 'Thêm địa chỉ thành công' };
  }

  async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
    ip?: string,
  ) {
    await this.checkActiveUser(userId);
    // Kiểm tra ownership
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Địa chỉ không tồn tại',
      });
    }

    const updated = await this.prisma.userAddress.update({
      where: { id: addressId },
      data: dto,
    });

    return { data: updated, message: 'Cập nhật địa chỉ thành công' };
  }

  async deleteAddress(userId: number, addressId: number, ip?: string) {
    await this.checkActiveUser(userId);
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Địa chỉ không tồn tại',
      });
    }

    await this.prisma.userAddress.delete({ where: { id: addressId } });

    // Nếu vừa xóa default → set cái mới nhất làm default
    if (address.isDefault) {
      const newest = await this.prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { id: 'desc' },
      });
      if (newest) {
        await this.prisma.userAddress.update({
          where: { id: newest.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Xóa địa chỉ thành công' };
  }

  async setDefaultAddress(userId: number, addressId: number, ip?: string) {
    await this.checkActiveUser(userId);
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Địa chỉ không tồn tại',
      });
    }

    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { message: 'Đã đặt làm địa chỉ mặc định' };
  }
}
