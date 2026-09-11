import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../../../common/errors/error-codes';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import {
  ADMIN_PERMISSION_VALUES,
  AdminPermissionValue,
} from '../../../common/constants/admin-permissions';

const ADMIN_PERMISSION_SET = new Set<string>(ADMIN_PERMISSION_VALUES);

@Injectable()
export class StaffAdminService {
  constructor(private prisma: PrismaService) {}

  async getStaffs(page: number = 1, limit: number = 20, keyword?: string) {
    const where: Prisma.UserWhereInput = {
      role: { in: [UserRole.ADMIN, UserRole.STAFF] },
    };
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
          permissions: true,
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createStaff(
    adminId: number,
    ip: string,
    body: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      permissions?: string[];
    },
  ) {
    this.assertKnownPermissions(body.permissions);

    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_EMAIL',
        message: 'Email đã tồn tại',
      });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          password: hashedPassword,
          role: UserRole.STAFF,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          permissions: body.permissions || [],
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CREATE_STAFF',
          targetType: 'USER',
          targetId: u.id,
          description: `Tạo tài khoản nhân viên: ${u.email}`,
          ipAddress: ip,
        },
      });

      return u;
    });
  }

  async updateStaff(
    adminId: number,
    ip: string,
    id: number,
    body: {
      fullName?: string;
      phone?: string;
      status?: string;
      permissions?: string[];
    },
  ) {
    this.assertKnownPermissions(body.permissions);

    const data: Prisma.UserUpdateInput = {};
    if (body.fullName) data.fullName = body.fullName;
    if (body.phone) data.phone = body.phone;
    if (body.permissions) data.permissions = body.permissions;
    if (this.isUserStatus(body.status)) data.status = body.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data });

      if (body.status === UserStatus.LOCKED) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revoked: false },
          data: { revoked: true },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE_STAFF',
          targetType: 'USER',
          targetId: id,
          description: this.describeStaffUpdate(body),
          ipAddress: ip,
        },
      });
    });
  }

  async deleteStaff(adminId: number, id: number, ip: string) {
    if (adminId === id) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Không thể tự xóa tài khoản của chính mình',
      });
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, status: true },
    });
    if (!actor || actor.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản người thực hiện đã bị khóa hoặc không hợp lệ',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Nhân viên không tồn tại',
      });
    }

    if (user.role !== UserRole.STAFF) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Chỉ có thể xóa tài khoản có vai trò Nhân viên (STAFF)',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          email: `DELETED_${id}_${user.email}`,
          status: UserStatus.LOCKED,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'DELETE_STAFF',
          targetType: 'USER',
          targetId: id,
          description: 'Xóa tài khoản nhân viên (Soft delete)',
          ipAddress: ip,
        },
      });
    });
  }

  private isUserStatus(value: unknown): value is UserStatus {
    return (
      typeof value === 'string' &&
      Object.values(UserStatus).includes(value as UserStatus)
    );
  }

  private assertKnownPermissions(
    permissions: string[] | undefined,
  ): asserts permissions is AdminPermissionValue[] | undefined {
    if (!permissions) return;
    const invalid = permissions.filter(
      (permission) => !ADMIN_PERMISSION_SET.has(permission),
    );
    if (invalid.length > 0) {
      throw new BadRequestException({
        code: 'INVALID_PERMISSION',
        message: `Permission không hợp lệ: ${invalid.join(', ')}`,
      });
    }
  }

  private describeStaffUpdate(body: {
    fullName?: string;
    phone?: string;
    status?: string;
    permissions?: string[];
  }) {
    const changes: string[] = [];
    if (body.fullName) changes.push('fullName');
    if (body.phone) changes.push('phone');
    if (body.status) changes.push(`status=${body.status}`);
    if (body.permissions) {
      changes.push(
        `permissions(${body.permissions.length})=${body.permissions.join(',')}`,
      );
    }
    return changes.length
      ? `Cập nhật nhân viên: ${changes.join('; ')}`
      : 'Cập nhật nhân viên';
  }
}
